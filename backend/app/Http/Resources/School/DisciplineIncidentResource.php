<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DisciplineIncident */
class DisciplineIncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'incident_date' => $this->incident_date?->toDateString(),
            'category' => $this->category,
            'severity' => $this->severity,
            'description' => $this->description,
            'action_taken' => $this->action_taken,
            'status' => $this->status,
            'reported_by_name' => $this->whenLoaded('reportedBy', fn () => $this->reportedBy?->name),
        ];
    }
}
