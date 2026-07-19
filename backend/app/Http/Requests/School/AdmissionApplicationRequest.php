<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdmissionApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('admissions.manage');
    }

    public function rules(): array
    {
        $schoolId = $this->user()->school_id;

        return [
            'academic_year_id' => [
                'required', 'uuid',
                Rule::exists('academic_years', 'id')->where('school_id', $schoolId),
            ],
            'applying_for_class_id' => [
                'required', 'uuid',
                Rule::exists('school_classes', 'id')->where('school_id', $schoolId),
            ],
            'applicant_first_name' => ['required', 'string', 'max:255'],
            'applicant_last_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'guardian_name' => ['required', 'string', 'max:255'],
            'guardian_phone' => ['required', 'string', 'max:50'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
