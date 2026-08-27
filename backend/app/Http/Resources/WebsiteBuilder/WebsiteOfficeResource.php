<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteOffice */
class WebsiteOfficeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'directorate_head' => $this->directorate_head,
            'description' => $this->description,
            'email' => $this->email,
            'phone' => $this->phone,
            'photo_url' => app(WebsiteMediaService::class)->url($this->photo_path),
            'is_visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
        ];
    }
}
