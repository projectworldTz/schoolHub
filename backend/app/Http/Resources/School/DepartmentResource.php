<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Department */
class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'head_user_id' => $this->head_user_id,
            'head_name' => $this->whenLoaded('head', fn () => $this->head?->name),
            'created_at' => $this->created_at,
        ];
    }
}
