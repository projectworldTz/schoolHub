<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffSalaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('payroll.manage');
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required', 'uuid', 'exists:users,id',
                Rule::unique('staff_salaries', 'user_id')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('staff_salary')),
            ],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'allowances' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
            'effective_from' => ['required', 'date'],
        ];
    }
}
