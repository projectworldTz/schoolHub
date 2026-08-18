<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StudentPromotion */
class StudentPromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student?->full_name),
            'student_admission_number' => $this->whenLoaded('student', fn () => $this->student?->admission_number),
            'from_academic_year_name' => $this->whenLoaded('fromAcademicYear', fn () => $this->fromAcademicYear?->name),
            'to_academic_year_name' => $this->whenLoaded('toAcademicYear', fn () => $this->toAcademicYear?->name),
            'from_school_class_name' => $this->whenLoaded('fromSchoolClass', fn () => $this->fromSchoolClass?->name),
            'to_school_class_name' => $this->whenLoaded('toSchoolClass', fn () => $this->toSchoolClass?->name),
            'action' => $this->action,
            'mode' => $this->mode,
            'promoted_by_name' => $this->whenLoaded('promotedBy', fn () => $this->promotedBy?->name),
            'promoted_at' => $this->promoted_at,
        ];
    }
}
