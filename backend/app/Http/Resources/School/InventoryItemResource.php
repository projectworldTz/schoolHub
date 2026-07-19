<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\InventoryItem */
class InventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'unit' => $this->unit,
            'quantity' => $this->quantity,
            'reorder_level' => $this->reorder_level,
            'low_stock' => $this->reorder_level !== null && $this->quantity <= $this->reorder_level,
        ];
    }
}
