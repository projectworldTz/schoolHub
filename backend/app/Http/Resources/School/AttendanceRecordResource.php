<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AttendanceRecord */
class AttendanceRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'school_class_id' => $this->school_class_id,
            'stream_id' => $this->stream_id,
            'date' => $this->date?->toDateString(),
            'status' => $this->status,
            'remarks' => $this->remarks,
            'marked_by' => $this->marked_by,
        ];
    }
}
