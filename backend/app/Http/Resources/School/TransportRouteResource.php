<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TransportRoute */
class TransportRouteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'vehicle_registration' => $this->vehicle_registration,
            'driver_name' => $this->driver_name,
            'driver_phone' => $this->driver_phone,
            'capacity' => $this->capacity,
            'assigned' => $this->whenCounted('activeAssignments'),
        ];
    }
}
