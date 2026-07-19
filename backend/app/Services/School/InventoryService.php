<?php

namespace App\Services\School;

use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function recordTransaction(array $data, ?string $recordedBy): InventoryTransaction
    {
        return DB::transaction(function () use ($data, $recordedBy) {
            $item = InventoryItem::whereKey($data['inventory_item_id'])->lockForUpdate()->first();

            if ($data['type'] === 'out' && $item->quantity < $data['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Not enough stock on hand for this item.',
                ]);
            }

            $item->quantity = $data['type'] === 'in'
                ? $item->quantity + $data['quantity']
                : $item->quantity - $data['quantity'];
            $item->save();

            return $item->transactions()->create([
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'reason' => $data['reason'] ?? null,
                'recorded_by' => $recordedBy,
                'transaction_date' => $data['transaction_date'] ?? now(),
            ]);
        });
    }
}
