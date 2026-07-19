<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\FeeStructure */
class FeeStructureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'term_id' => $this->term_id,
            'term_name' => $this->whenLoaded('term', fn () => $this->term?->name),
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass?->name),
            'fee_category_id' => $this->fee_category_id,
            'fee_category_name' => $this->whenLoaded('feeCategory', fn () => $this->feeCategory->name),
            'amount' => $this->amount,
            'due_date' => $this->due_date?->toDateString(),
        ];
    }
}
