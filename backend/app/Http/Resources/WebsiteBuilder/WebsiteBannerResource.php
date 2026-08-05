<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteBanner */
class WebsiteBannerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_url' => app(WebsiteMediaService::class)->url($this->image_path),
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'link_url' => $this->link_url,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
        ];
    }
}
