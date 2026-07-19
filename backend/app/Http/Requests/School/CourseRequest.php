<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class CourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('lms.manage');
    }

    public function rules(): array
    {
        return [
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'school_class_id' => ['nullable', 'uuid', 'exists:school_classes,id'],
            'teacher_id' => ['required', 'uuid', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
