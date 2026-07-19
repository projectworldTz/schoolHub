<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnrollStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('students.manage');
    }

    public function rules(): array
    {
        $schoolId = $this->user()->school_id;

        return [
            'academic_year_id' => [
                'required', 'uuid',
                Rule::exists('academic_years', 'id')->where('school_id', $schoolId),
            ],
            'school_class_id' => [
                'required', 'uuid',
                Rule::exists('school_classes', 'id')->where('school_id', $schoolId),
            ],
            'stream_id' => [
                'nullable', 'uuid',
                Rule::exists('streams', 'id')->where('school_id', $schoolId),
            ],
            'enrolled_at' => ['required', 'date'],
            'status' => ['sometimes', Rule::in(['active', 'transferred', 'graduated', 'withdrawn'])],
        ];
    }
}
