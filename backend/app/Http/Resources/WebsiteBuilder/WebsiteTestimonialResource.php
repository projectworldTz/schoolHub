<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteTestimonial */
class WebsiteTestimonialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author_name' => $this->author_name,
            'author_role' => $this->author_role,
            'message' => $this->message,
            'photo_url' => app(WebsiteMediaService::class)->url($this->photo_path),
            'is_published' => $this->is_published,
            'sort_order' => $this->sort_order,
        ];
    }
}
