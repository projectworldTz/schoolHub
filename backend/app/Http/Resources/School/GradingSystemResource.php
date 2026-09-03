<?php

namespace App\Http\Resources\School;

use App\Models\GradingSystem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GradingSystem */
class GradingSystemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_default' => $this->is_default,
            'necta_enabled' => $this->necta_enabled,
            'points_subject_count' => $this->points_subject_count,
            'division_rules' => $this->division_rules ?? [],
            'assessment_weights' => $this->assessment_weights ?? [],
            'grade_bands' => GradeBandResource::collection($this->whenLoaded('gradeBands')),
            'created_at' => $this->created_at,
        ];
    }
}
