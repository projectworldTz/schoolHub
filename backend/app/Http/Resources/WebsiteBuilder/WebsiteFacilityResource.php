<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteFacility */
class WebsiteFacilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'icon_key' => $this->icon_key,
            'image_url' => app(WebsiteMediaService::class)->url($this->image_path),
            'sort_order' => $this->sort_order,
        ];
    }
}
