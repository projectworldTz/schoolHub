<?php

namespace App\Http\Requests\School;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('announcements.manage');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'audience' => ['required', Rule::in(['school', 'class', 'role'])],
            'school_class_id' => ['required_if:audience,class', 'nullable', 'uuid', 'exists:school_classes,id'],
            'role' => ['required_if:audience,role', 'nullable', 'string', 'max:100'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * A class-audience announcement is limited to the author's own assigned
     * classes unless they hold classes.manage — otherwise e.g. a Class
     * Teacher (who has announcements.manage but not classes.manage) could
     * post into any class in the school, not just their own.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $classId = $this->input('school_class_id');

            if ($this->input('audience') === 'class'
                && $classId
                && ! $this->user()->canAccessClass($classId)) {
                $validator->errors()->add('school_class_id', 'You are not assigned to this class.');
            }
        });
    }
}
