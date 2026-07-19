<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StudentEnrollment */
class StudentEnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass->name),
            'branch_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass->relationLoaded('branch') ? $this->schoolClass->branch?->name : null),
            'stream_id' => $this->stream_id,
            'stream_name' => $this->whenLoaded('stream', fn () => $this->stream?->name),
            'status' => $this->status,
            'enrolled_at' => $this->enrolled_at,
        ];
    }
}
