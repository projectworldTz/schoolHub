<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class InventoryTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('inventory.manage');
    }

    public function rules(): array
    {
        return [
            'inventory_item_id' => ['required', 'uuid', 'exists:inventory_items,id'],
            'type' => ['required', 'in:in,out'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:255'],
            'transaction_date' => ['nullable', 'date'],
        ];
    }
}
