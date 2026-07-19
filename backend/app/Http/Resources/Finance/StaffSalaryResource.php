<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StaffSalary */
class StaffSalaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'basic_salary' => $this->basic_salary,
            'allowances' => $this->allowances,
            'deductions' => $this->deductions,
            'net_salary' => $this->net_salary,
            'effective_from' => $this->effective_from?->toDateString(),
        ];
    }
}
