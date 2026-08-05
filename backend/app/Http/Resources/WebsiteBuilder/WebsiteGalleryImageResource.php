<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteGalleryImage */
class WebsiteGalleryImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'website_gallery_album_id' => $this->website_gallery_album_id,
            'image_url' => app(WebsiteMediaService::class)->url($this->image_path),
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
        ];
    }
}
