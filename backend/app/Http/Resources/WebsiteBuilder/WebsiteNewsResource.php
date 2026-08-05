<?php

namespace App\Http\Resources\WebsiteBuilder;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteNews */
class WebsiteNewsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'is_featured' => $this->is_featured,
            'sort_order' => $this->sort_order,
            'announcement' => [
                'id' => $this->announcement->id,
                'title' => $this->announcement->title,
                'body' => $this->announcement->body,
                'published_at' => $this->announcement->published_at,
            ],
        ];
    }
}
