<?php

namespace App\Http\Requests\School;

use Illuminate\Contracts\Validation\Validator;
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

    /**
     * exams.manage is held by Class Teacher as well as school-wide academic
     * admins — without this, a Class Teacher could add exam-subjects (and
     * thus record/view marks) for any class in the school, not just theirs.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $classId = $this->input('school_class_id');

            if ($classId && ! $this->user()->canAccessClass($classId)) {
                $validator->errors()->add('school_class_id', 'You are not assigned to this class.');
            }
        });
    }
}
