<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayrollRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('payroll.manage');
    }

    public function rules(): array
    {
        return [
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => [
                'required', 'integer', 'min:2020', 'max:2100',
                Rule::unique('payroll_runs')->where('school_id', $this->user()->school_id)->where('month', $this->input('month')),
            ],
        ];
    }
}
