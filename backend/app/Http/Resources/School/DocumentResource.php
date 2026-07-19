<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Document */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'uploaded_by' => $this->uploaded_by,
            'uploader_name' => $this->whenLoaded('uploader', fn () => $this->uploader?->name),
            'created_at' => $this->created_at,
        ];
    }
}
