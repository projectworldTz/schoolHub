<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('classes.manage');
    }

    public function rules(): array
    {
        $schoolId = $this->user()->school_id;

        return [
            'school_class_id' => [
                'required', 'uuid',
                Rule::exists('school_classes', 'id')->where('school_id', $schoolId),
            ],
            'academic_year_id' => [
                'required', 'uuid',
                Rule::exists('academic_years', 'id')->where('school_id', $schoolId),
            ],
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('streams', 'name')
                    ->where('school_class_id', $this->input('school_class_id'))
                    ->where('academic_year_id', $this->input('academic_year_id'))
                    ->ignore($this->route('stream')),
            ],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'class_teacher_id' => [
                'nullable', 'uuid',
                Rule::exists('users', 'id')->where('school_id', $schoolId),
            ],
            'room_id' => [
                'nullable', 'uuid',
                Rule::exists('rooms', 'id')->where('school_id', $schoolId),
            ],
        ];
    }
}
