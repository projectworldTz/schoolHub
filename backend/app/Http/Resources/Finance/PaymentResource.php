<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'amount' => $this->amount,
            'method' => $this->method,
            'provider' => $this->provider,
            'reference' => $this->reference,
            'paid_at' => $this->paid_at?->toDateString(),
            'received_by_name' => $this->whenLoaded('receivedBy', fn () => $this->receivedBy?->name),
            'notes' => $this->notes,
        ];
    }
}
