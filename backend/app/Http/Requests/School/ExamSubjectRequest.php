<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class ExamSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exams.manage');
    }

    public function rules(): array
    {
        return [
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'max_marks' => ['required', 'numeric', 'min:1'],
            'pass_marks' => ['nullable', 'numeric', 'min:0', 'lte:max_marks'],
            'exam_date' => ['nullable', 'date'],
        ];
    }
}
