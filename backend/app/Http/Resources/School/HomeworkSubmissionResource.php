<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HomeworkSubmission */
class HomeworkSubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'homework_id' => $this->homework_id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'admission_number' => $this->whenLoaded('student', fn () => $this->student->admission_number),
            'status' => $this->status,
            'submitted_at' => $this->submitted_at,
            'grade' => $this->grade,
            'feedback' => $this->feedback,
        ];
    }
}
