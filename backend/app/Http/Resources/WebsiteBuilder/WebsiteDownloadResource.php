<?php

namespace App\Http\Resources\WebsiteBuilder;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteDownload */
class WebsiteDownloadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'file_size' => $this->file_size,
            'download_count' => $this->download_count,
            'sort_order' => $this->sort_order,
        ];
    }
}
