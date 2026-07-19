<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoicesRequest extends FormRequest
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
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'fee_structure_ids' => ['required', 'array', 'min:1'],
            'fee_structure_ids.*' => ['uuid', 'exists:fee_structures,id'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}
