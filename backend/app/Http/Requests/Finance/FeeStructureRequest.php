<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;

class FeeStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('finance.manage');
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'term_id' => ['nullable', 'uuid', 'exists:terms,id'],
            'school_class_id' => ['nullable', 'uuid', 'exists:school_classes,id'],
            'fee_category_id' => ['required', 'uuid', 'exists:fee_categories,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}
