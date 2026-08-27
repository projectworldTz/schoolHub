<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteLeadershipMember */
class WebsiteLeadershipMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'role_title' => $this->role_title,
            'bio' => $this->bio,
            'photo_url' => app(WebsiteMediaService::class)->url($this->photo_path),
            'is_visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
        ];
    }
}
