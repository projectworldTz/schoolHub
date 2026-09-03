<?php

namespace App\Http\Resources\Finance;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'fee_category_id' => $this->fee_category_id,
            'fee_category_name' => $this->whenLoaded('feeCategory', fn () => $this->feeCategory?->name),
            'amount' => $this->amount,
            'method' => $this->method,
            'provider' => $this->provider,
            'reference' => $this->reference,
            'paid_at' => $this->paid_at?->toDateString(),
            'received_by_name' => $this->whenLoaded('receivedBy', fn () => $this->receivedBy?->name),
            'notes' => $this->notes,
            'reversal' => $this->whenLoaded('reversal', fn () => $this->reversal ? [
                'id' => $this->reversal->id,
                'amount' => $this->reversal->amount,
                'reason' => $this->reversal->reason,
                'reversed_at' => $this->reversal->reversed_at?->toIso8601String(),
            ] : null),
        ];
    }
}
