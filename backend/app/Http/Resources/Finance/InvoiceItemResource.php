<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\InvoiceItem */
class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => $this->amount,
            'fee_category_id' => $this->whenLoaded('feeStructure', fn () => $this->feeStructure?->fee_category_id),
            'fee_category_name' => $this->whenLoaded(
                'feeStructure',
                fn () => $this->feeStructure?->feeCategory?->name
            ),
        ];
    }
}
