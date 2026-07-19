<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TimetableEntry */
class TimetableEntryResource extends JsonResource
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
            'room_id' => $this->room_id,
            'room_name' => $this->whenLoaded('room', fn () => $this->room?->name),
            'timetable_period_id' => $this->timetable_period_id,
            'period' => new TimetablePeriodResource($this->whenLoaded('period')),
            'academic_year_id' => $this->academic_year_id,
            'day_of_week' => $this->day_of_week,
        ];
    }
}
