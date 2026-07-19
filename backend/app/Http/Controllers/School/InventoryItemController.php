<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\InventoryItemRequest;
use App\Http\Resources\School\InventoryItemResource;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $items = InventoryItem::query()
            ->when($request->input('search'), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereNotNull('reorder_level')->whereColumn('quantity', '<=', 'reorder_level'))
            ->orderBy('name')
            ->get();

        return InventoryItemResource::collection($items);
    }

    public function store(InventoryItemRequest $request)
    {
        $item = InventoryItem::create($request->validated());

        return new InventoryItemResource($item);
    }

    public function update(InventoryItemRequest $request, InventoryItem $inventory_item)
    {
        $inventory_item->update($request->validated());

        return new InventoryItemResource($inventory_item);
    }

    public function destroy(Request $request, InventoryItem $inventory_item)
    {
        abort_unless($request->user()->can('inventory.manage'), 403);

        $inventory_item->delete();

        return response()->noContent();
    }
}
