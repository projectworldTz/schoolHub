<?php

namespace App\Http\Resources\WebsiteBuilder;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteGalleryAlbum */
class WebsiteGalleryAlbumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'sort_order' => $this->sort_order,
            'images_count' => $this->whenCounted('images'),
            'images' => WebsiteGalleryImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
