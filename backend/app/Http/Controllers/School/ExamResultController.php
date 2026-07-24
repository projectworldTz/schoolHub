<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\RecordExamMarksRequest;
use App\Http\Resources\School\ExamResultResource;
use App\Models\ExamSubject;
use App\Services\School\ExamService;
use Illuminate\Support\Facades\DB;

class ExamResultController extends Controller
{
    public function __construct(protected ExamService $examService) {}

    /**
     * Bulk-record marks for every student in one exam_subject at once —
     * the gradebook entry screen, mirroring AttendanceController::store.
     */
    public function update(RecordExamMarksRequest $request, ExamSubject $examSubject)
    {
        abort_if(
            $examSubject->isLocked(),
            423,
            'This gradebook was submitted more than '.ExamSubject::EDIT_GRACE_PERIOD_HOURS.' hours ago and is locked. '
                .'Ask the Academic Master to approve an edit request before making further changes.'
        );

        $data = $request->validated();

        DB::transaction(function () use ($data, $examSubject, $request) {
            $results = $examSubject->results()->get()->keyBy('student_id');

            foreach ($data['records'] as $record) {
                $result = $results->get($record['student_id']);
                if (! $result) {
                    continue;
                }

                $this->examService->recordMarks(
                    $result,
                    array_key_exists('marks_obtained', $record) ? $record['marks_obtained'] : null,
                    $record['remarks'] ?? null,
                    $request->user()->id,
                );
            }
        });

        return ExamResultResource::collection(
            $examSubject->results()->with('student')->get()
        );
    }
}
