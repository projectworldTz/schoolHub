<?php

namespace App\Http\Requests\Finance;

use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FeeCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('finance.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('fee_categories', 'name')
                    ->where('school_id', Tenant::id())
                    ->ignore($this->route('fee_category')),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
