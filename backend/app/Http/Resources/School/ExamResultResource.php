<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ExamResult */
class ExamResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_subject_id' => $this->exam_subject_id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'admission_number' => $this->whenLoaded('student', fn () => $this->student->admission_number),
            'marks_obtained' => $this->marks_obtained,
            'grade' => $this->grade,
            'remarks' => $this->remarks,
        ];
    }
}
