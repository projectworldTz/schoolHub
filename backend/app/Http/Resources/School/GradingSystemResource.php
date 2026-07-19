<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\GradingSystem */
class GradingSystemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_default' => $this->is_default,
            'grade_bands' => GradeBandResource::collection($this->whenLoaded('gradeBands')),
            'created_at' => $this->created_at,
        ];
    }
}
