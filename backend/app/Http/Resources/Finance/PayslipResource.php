<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Payslip */
class PayslipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payroll_run_id' => $this->payroll_run_id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'basic_salary' => $this->basic_salary,
            'allowances' => $this->allowances,
            'deductions' => $this->deductions,
            'net_salary' => $this->net_salary,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toDateString(),
        ];
    }
}
