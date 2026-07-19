<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TimetablePeriod */
class TimetablePeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'sort_order' => $this->sort_order,
            'is_break' => $this->is_break,
        ];
    }
}
