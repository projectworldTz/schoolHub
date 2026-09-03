<?php

namespace App\Http\Resources\School;

use App\Models\GradeBand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GradeBand */
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
            'points' => $this->points,
        ];
    }
}
