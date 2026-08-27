<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsitePolicy */
class WebsitePolicyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'document_url' => app(WebsiteMediaService::class)->url($this->document_path),
            'is_visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
        ];
    }
}
