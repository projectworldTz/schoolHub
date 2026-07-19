<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Homework */
class HomeworkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass->name),
            'stream_id' => $this->stream_id,
            'stream_name' => $this->whenLoaded('stream', fn () => $this->stream?->name),
            'subject_id' => $this->subject_id,
            'subject_name' => $this->whenLoaded('subject', fn () => $this->subject->name),
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->whenLoaded('teacher', fn () => $this->teacher->name),
            'academic_year_id' => $this->academic_year_id,
            'title' => $this->title,
            'description' => $this->description,
            'due_date' => $this->due_date?->toDateString(),
            'submissions_count' => $this->whenCounted('submissions'),
            'submissions' => HomeworkSubmissionResource::collection($this->whenLoaded('submissions')),
            'created_at' => $this->created_at,
        ];
    }
}
