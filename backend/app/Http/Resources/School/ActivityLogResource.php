<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ActivityLog */
class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject_type' => class_basename($this->subject_type),
            'subject_id' => $this->subject_id,
            'action' => $this->action,
            'description' => $this->description,
            'changes' => $this->changes,
            'user_name' => $this->whenLoaded('user', fn () => $this->user?->name ?? 'System'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
