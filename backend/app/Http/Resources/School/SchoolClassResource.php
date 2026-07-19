<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SchoolClass */
class SchoolClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'level' => $this->level,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->whenLoaded('branch', fn () => $this->branch?->name),
            'subjects' => SubjectResource::collection($this->whenLoaded('subjects')),
            'streams' => StreamResource::collection($this->whenLoaded('streams')),
            'created_at' => $this->created_at,
        ];
    }
}
