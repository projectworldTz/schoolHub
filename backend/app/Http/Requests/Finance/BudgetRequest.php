<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;

class BudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('expenses.manage');
    }

    public function rules(): array
    {
        return [
            'expense_category_id' => ['required', 'uuid', 'exists:expense_categories,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
