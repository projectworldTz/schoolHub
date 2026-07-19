<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\InventoryTransaction */
class InventoryTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inventory_item_id' => $this->inventory_item_id,
            'item_name' => $this->whenLoaded('item', fn () => $this->item->name),
            'type' => $this->type,
            'quantity' => $this->quantity,
            'reason' => $this->reason,
            'recorded_by_name' => $this->whenLoaded('recordedBy', fn () => $this->recordedBy?->name),
            'transaction_date' => $this->transaction_date?->toDateString(),
        ];
    }
}
