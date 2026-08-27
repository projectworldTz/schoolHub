<?php

namespace App\Http\Resources\WebsiteBuilder;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteAdmissionClass */
class WebsiteAdmissionClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_class_id' => $this->school_class_id,
            'class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass?->name),
            'class_level' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass?->level),
            'summary' => $this->summary,
            'requirements' => $this->requirements,
            'is_visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
        ];
    }
}
