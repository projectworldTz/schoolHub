<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StudentStatusChange */
class StudentStatusChangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'admission_number' => $this->whenLoaded('student', fn () => $this->student->admission_number),
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'effective_date' => $this->effective_date?->toDateString(),
            'reason' => $this->reason,
            'changed_by_name' => $this->whenLoaded('changedBy', fn () => $this->changedBy?->name),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
