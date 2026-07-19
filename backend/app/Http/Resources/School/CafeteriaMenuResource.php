<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CafeteriaMenu */
class CafeteriaMenuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_date' => $this->menu_date?->toDateString(),
            'meal_type' => $this->meal_type,
            'description' => $this->description,
        ];
    }
}
