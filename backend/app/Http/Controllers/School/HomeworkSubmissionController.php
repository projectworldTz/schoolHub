<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\GradeHomeworkSubmissionRequest;
use App\Http\Resources\School\HomeworkSubmissionResource;
use App\Models\HomeworkSubmission;

class HomeworkSubmissionController extends Controller
{
    public function update(GradeHomeworkSubmissionRequest $request, HomeworkSubmission $submission)
    {
        $data = $request->validated();

        if ($data['status'] === 'submitted' && ! $submission->submitted_at) {
            $data['submitted_at'] = now();
        }

        $submission->update($data);

        return new HomeworkSubmissionResource($submission->load('student'));
    }
}
