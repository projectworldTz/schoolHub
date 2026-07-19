<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class InventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('inventory.manage');
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:50'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
        ];

        // Starting stock is only settable at creation time; after that,
        // quantity only moves via recorded in/out transactions.
        if ($this->isMethod('post')) {
            $rules['quantity'] = ['nullable', 'integer', 'min:0'];
        }

        return $rules;
    }
}
