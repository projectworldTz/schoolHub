<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Stream */
class StreamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_class_id' => $this->school_class_id,
            'academic_year_id' => $this->academic_year_id,
            'name' => $this->name,
            'capacity' => $this->capacity,
            'class_teacher_id' => $this->class_teacher_id,
            'class_teacher_name' => $this->whenLoaded('classTeacher', fn () => $this->classTeacher?->name),
            'room_id' => $this->room_id,
            'room_name' => $this->whenLoaded('room', fn () => $this->room?->name),
        ];
    }
}
