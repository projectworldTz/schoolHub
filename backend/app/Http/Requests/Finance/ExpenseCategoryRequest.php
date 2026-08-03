<?php

namespace App\Http\Requests\Finance;

use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('expenses.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('expense_categories', 'name')
                    ->where('school_id', Tenant::id())
                    ->ignore($this->route('expense_category')),
            ],
        ];
    }
}
