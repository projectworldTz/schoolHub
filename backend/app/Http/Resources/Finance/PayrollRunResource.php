<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PayrollRun */
class PayrollRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'month' => $this->month,
            'year' => $this->year,
            'status' => $this->status,
            'processed_at' => $this->processed_at,
            'payslips_count' => $this->whenCounted('payslips'),
            'payslips' => PayslipResource::collection($this->whenLoaded('payslips')),
            'created_at' => $this->created_at,
        ];
    }
}
