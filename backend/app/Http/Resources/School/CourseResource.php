<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Course */
class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject_id' => $this->subject_id,
            'subject_name' => $this->whenLoaded('subject', fn () => $this->subject->name),
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass?->name),
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->whenLoaded('teacher', fn () => $this->teacher->name),
            'title' => $this->title,
            'description' => $this->description,
            'is_published' => $this->is_published,
            'lessons_count' => $this->whenCounted('lessons'),
            'lessons' => LessonResource::collection($this->whenLoaded('lessons')),
            'created_at' => $this->created_at,
        ];
    }
}
