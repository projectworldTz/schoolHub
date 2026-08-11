<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StudentFeeExclusion */
class StudentFeeExclusionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'fee_category_id' => $this->fee_category_id,
            'fee_category_name' => $this->whenLoaded('feeCategory', fn () => $this->feeCategory?->name),
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear?->name),
            'reason' => $this->reason,
            'excluded_by_name' => $this->whenLoaded('excludedBy', fn () => $this->excludedBy?->name),
            'created_at' => $this->created_at,
        ];
    }
}
