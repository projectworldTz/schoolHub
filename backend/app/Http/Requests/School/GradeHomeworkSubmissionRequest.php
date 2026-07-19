<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GradeHomeworkSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('homework.manage');
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['pending', 'submitted', 'graded', 'late'])],
            'grade' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
