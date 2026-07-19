<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\ExamRequest;
use App\Http\Resources\School\ExamResource;
use App\Models\Exam;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $exams = Exam::query()
            ->with(['academicYear', 'term'])
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->where('academic_year_id', $id))
            ->orderByDesc('start_date')
            ->get();

        return ExamResource::collection($exams);
    }

    public function store(ExamRequest $request)
    {
        $exam = Exam::create($request->validated());

        return new ExamResource($exam->load(['academicYear', 'term']));
    }

    public function show(Exam $exam)
    {
        return new ExamResource(
            $exam->load(['academicYear', 'term', 'examSubjects.schoolClass', 'examSubjects.subject'])
        );
    }

    public function update(ExamRequest $request, Exam $exam)
    {
        $exam->update($request->validated());

        return new ExamResource($exam->load(['academicYear', 'term']));
    }

    public function destroy(Request $request, Exam $exam)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $exam->delete();

        return response()->noContent();
    }

    /**
     * A dedicated status transition rather than routing through update()
     * (which requires the full exam payload) — same "one action, one
     * endpoint" pattern as admissions/{admission}/accept or
     * hostel-allocations/{allocation}/vacate. 'published' is the status
     * that makes an exam's results visible on the public Notice Board and
     * to the Parent Portal — see NoticeBoardController.
     */
    public function updateStatus(Request $request, Exam $exam)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(['draft', 'scheduled', 'completed', 'published'])],
        ]);

        $exam->update($data);

        return new ExamResource($exam->load(['academicYear', 'term']));
    }
}
