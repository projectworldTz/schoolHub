<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\ExamEditRequestRequest;
use App\Http\Requests\School\ReviewExamEditRequestRequest;
use App\Http\Resources\School\ExamEditRequestResource;
use App\Models\ExamEditRequest;
use App\Models\ExamSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ExamEditRequestController extends Controller
{
    /** Academic Master (and equivalents, via exams.manage) see every request; a teacher sees only their own. */
    public function index(Request $request)
    {
        $query = ExamEditRequest::query()
            ->with(['examSubject.exam', 'examSubject.schoolClass', 'examSubject.subject', 'requestedBy', 'reviewer'])
            ->latest();

        if (! $request->user()->can('exams.manage')) {
            $query->where('requested_by', $request->user()->id);
        }

        return ExamEditRequestResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function store(ExamEditRequestRequest $request)
    {
        $editRequest = $request->user()->examEditRequests()->create($request->validated());

        return new ExamEditRequestResource(
            $editRequest->load(['examSubject.exam', 'examSubject.schoolClass', 'examSubject.subject', 'requestedBy'])
        );
    }

    /**
     * Approval opens a fresh 24h edit window (ExamSubject::EDIT_GRACE_PERIOD_HOURS)
     * from now, rather than unlocking indefinitely — the gradebook re-locks
     * automatically once that passes, same as the original submission grace period.
     */
    public function review(ReviewExamEditRequestRequest $request, ExamEditRequest $examEditRequest)
    {
        $status = $request->validated('status');

        $examEditRequest->update([
            'status' => $status,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Carbon::now(),
            'unlocked_until' => $status === 'approved' ? Carbon::now()->addHours(ExamSubject::EDIT_GRACE_PERIOD_HOURS) : null,
        ]);

        return new ExamEditRequestResource(
            $examEditRequest->load(['examSubject.exam', 'examSubject.schoolClass', 'examSubject.subject', 'requestedBy', 'reviewer'])
        );
    }

    public function destroy(Request $request, ExamEditRequest $examEditRequest)
    {
        abort_unless(
            $examEditRequest->requested_by === $request->user()->id || $request->user()->can('exams.manage'),
            403
        );

        $examEditRequest->delete();

        return response()->noContent();
    }
}
