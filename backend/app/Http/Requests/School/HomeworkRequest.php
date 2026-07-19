<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class HomeworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('homework.manage');
    }

    public function rules(): array
    {
        return [
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'stream_id' => ['nullable', 'uuid', 'exists:streams,id'],
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'teacher_id' => ['required', 'uuid', 'exists:users,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['required', 'date'],
        ];
    }
}
