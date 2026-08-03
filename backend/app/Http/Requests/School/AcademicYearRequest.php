<?php

namespace App\Http\Requests\School;

use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('school-settings.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('academic_years', 'name')
                    ->where('school_id', Tenant::id())
                    ->ignore($this->route('academic_year')),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }
}
