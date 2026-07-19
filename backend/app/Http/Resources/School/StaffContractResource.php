<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StaffContract */
class StaffContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'contract_type' => $this->contract_type,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'salary' => $this->salary,
            'notes' => $this->notes,
        ];
    }
}
