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

    public function show(ExamSubject $examSubject)
    {
        return new ExamSubjectResource(
            $examSubject->load(['schoolClass', 'subject', 'results.student'])
        );
    }

    public function destroy(Request $request, ExamSubject $examSubject)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $examSubject->delete();

        return response()->noContent();
    }

    public function results(ExamSubject $examSubject)
    {
        return ExamResultResource::collection(
            $examSubject->results()->with('student')->get()
        );
    }
}
