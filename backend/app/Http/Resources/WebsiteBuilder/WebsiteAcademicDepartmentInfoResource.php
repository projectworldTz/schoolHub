<?php

namespace App\Http\Resources\WebsiteBuilder;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteAcademicDepartmentInfo */
class WebsiteAcademicDepartmentInfoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'department_id' => $this->department_id,
            'department_name' => $this->whenLoaded('department', fn () => $this->department?->name),
            'department_code' => $this->whenLoaded('department', fn () => $this->department?->code),
            'subjects' => $this->whenLoaded('department', fn () => $this->department?->subjects->pluck('name')->values()),
            'public_description' => $this->public_description,
            'is_visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
        ];
    }
}
