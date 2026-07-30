<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\ExamSubjectRequest;
use App\Http\Resources\School\ExamResultResource;
use App\Http\Resources\School\ExamSubjectResource;
use App\Models\Exam;
use App\Models\ExamSubject;
use App\Services\School\ExamService;
use Illuminate\Http\Request;

class ExamSubjectController extends Controller
{
    public function __construct(protected ExamService $examService) {}

    public function store(ExamSubjectRequest $request, Exam $exam)
    {
        $examSubject = $this->examService->addSubject($exam, $request->validated());

        return new ExamSubjectResource($examSubject->load(['schoolClass', 'subject']));
    }

    public function show(Request $request, ExamSubject $examSubject)
    {
        abort_unless(
            $request->user()->can('exams.manage') || $request->user()->can('exam-marks.record'),
            403
        );
        abort_unless($request->user()->canAccessClass($examSubject->school_class_id), 403);

        return new ExamSubjectResource(
            $examSubject->load(['schoolClass', 'subject', 'results.student'])
        );
    }

    public function destroy(Request $request, ExamSubject $examSubject)
    {
        abort_unless($request->user()->can('exams.manage'), 403);
        abort_unless($request->user()->canAccessClass($examSubject->school_class_id), 403);

        $examSubject->delete();

        return response()->noContent();
    }

    /**
     * The grading teacher's explicit "I'm done" action — distinct from the
     * ordinary save in ExamResultController::update(), which can be called
     * any number of times beforehand. Starts the 24h edit grace period
     * (ExamSubject::EDIT_GRACE_PERIOD_HOURS); once it elapses, further saves
     * are blocked until an Academic Master approves an ExamEditRequest.
     */
    public function submit(Request $request, ExamSubject $examSubject)
    {
        abort_unless($request->user()->can('exam-marks.record'), 403);
        abort_unless($request->user()->canAccessClass($examSubject->school_class_id), 403);
        abort_if($examSubject->submitted_at, 422, 'This gradebook has already been submitted.');

        $examSubject->update(['submitted_at' => now()]);

        return new ExamSubjectResource($examSubject->load(['schoolClass', 'subject']));
    }

    public function results(Request $request, ExamSubject $examSubject)
    {
        abort_unless(
            $request->user()->can('exams.manage') || $request->user()->can('exam-marks.record'),
            403
        );
        abort_unless($request->user()->canAccessClass($examSubject->school_class_id), 403);

        return ExamResultResource::collection(
            $examSubject->results()->with('student')->get()
        );
    }
}
