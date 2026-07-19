<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\GradeBand */
class GradeBandResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'min_score' => $this->min_score,
            'max_score' => $this->max_score,
            'remark' => $this->remark,
            'gpa' => $this->gpa,
        ];
    }
}
