<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Lesson */
class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'content' => $this->content,
            'sort_order' => $this->sort_order,
            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at,
        ];
    }
}
