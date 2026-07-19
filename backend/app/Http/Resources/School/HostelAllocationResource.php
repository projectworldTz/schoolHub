<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HostelAllocation */
class HostelAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'hostel_room_id' => $this->hostel_room_id,
            'room_name' => $this->whenLoaded('room', fn () => $this->room->name),
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'allocated_at' => $this->allocated_at?->toDateString(),
            'vacated_at' => $this->vacated_at?->toDateString(),
            'status' => $this->status,
        ];
    }
}
