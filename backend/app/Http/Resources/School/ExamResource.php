<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Exam */
class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'term_id' => $this->term_id,
            'term_name' => $this->whenLoaded('term', fn () => $this->term?->name),
            'name' => $this->name,
            'exam_type' => $this->exam_type,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'subjects' => ExamSubjectResource::collection($this->whenLoaded('examSubjects')),
            'created_at' => $this->created_at,
        ];
    }
}
