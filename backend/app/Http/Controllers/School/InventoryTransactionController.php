<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\InventoryTransactionRequest;
use App\Http\Resources\School\InventoryTransactionResource;
use App\Models\InventoryTransaction;
use App\Services\School\InventoryService;
use Illuminate\Http\Request;

class InventoryTransactionController extends Controller
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function index(Request $request)
    {
        $transactions = InventoryTransaction::query()
            ->with(['item', 'recordedBy'])
            ->when($request->input('inventory_item_id'), fn ($q, $id) => $q->where('inventory_item_id', $id))
            ->when($request->input('type'), fn ($q, $type) => $q->where('type', $type))
            ->orderByDesc('transaction_date')
            ->paginate($request->integer('per_page', 20));

        return InventoryTransactionResource::collection($transactions);
    }

    public function store(InventoryTransactionRequest $request)
    {
        $transaction = $this->inventoryService->recordTransaction($request->validated(), $request->user()->id);

        return new InventoryTransactionResource($transaction->load(['item', 'recordedBy']));
    }
}
