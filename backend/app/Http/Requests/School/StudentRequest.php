<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('students.manage');
    }

    public function rules(): array
    {
        return [
            'admission_number' => [
                'required', 'string', 'max:50',
                Rule::unique('students', 'admission_number')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('student')),
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'medical_notes' => ['nullable', 'string', 'max:1000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'previous_school_name' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'graduated', 'transferred', 'withdrawn'])],
        ];
    }
}
