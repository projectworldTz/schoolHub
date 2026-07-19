<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ClinicVisit */
class ClinicVisitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'visit_date' => $this->visit_date?->toDateString(),
            'reason' => $this->reason,
            'diagnosis' => $this->diagnosis,
            'treatment' => $this->treatment,
            'follow_up_date' => $this->follow_up_date?->toDateString(),
            'recorded_by_name' => $this->whenLoaded('recordedBy', fn () => $this->recordedBy?->name),
        ];
    }
}
