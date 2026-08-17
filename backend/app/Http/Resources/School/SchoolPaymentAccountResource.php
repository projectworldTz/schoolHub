<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SchoolPaymentAccount */
class SchoolPaymentAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_name' => $this->account_name,
            'account_number' => $this->account_number,
            'currency' => $this->currency,
            'created_at' => $this->created_at,
        ];
    }
}
