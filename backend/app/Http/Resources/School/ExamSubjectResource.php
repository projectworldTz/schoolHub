<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ExamSubject */
class ExamSubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_id' => $this->exam_id,
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass->name),
            'subject_id' => $this->subject_id,
            'subject_name' => $this->whenLoaded('subject', fn () => $this->subject->name),
            'max_marks' => $this->max_marks,
            'pass_marks' => $this->pass_marks,
            'exam_date' => $this->exam_date?->toDateString(),
            'results' => ExamResultResource::collection($this->whenLoaded('results')),
        ];
    }
}
