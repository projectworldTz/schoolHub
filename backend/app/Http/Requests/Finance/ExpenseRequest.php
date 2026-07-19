<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('expenses.manage');
    }

    public function rules(): array
    {
        return [
            'expense_category_id' => ['required', 'uuid', 'exists:expense_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:1000'],
            'expense_date' => ['required', 'date'],
        ];
    }
}
