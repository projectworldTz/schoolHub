<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TransportAssignment */
class TransportAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'transport_route_id' => $this->transport_route_id,
            'route_name' => $this->whenLoaded('route', fn () => $this->route->name),
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'pickup_point' => $this->pickup_point,
            'status' => $this->status,
        ];
    }
}
