<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Announcement */
class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'audience' => $this->audience,
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass?->name),
            'role' => $this->role,
            'created_by' => $this->created_by,
            'created_by_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
        ];
    }
}
