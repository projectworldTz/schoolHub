<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exams.manage');
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'term_id' => ['nullable', 'uuid', 'exists:terms,id'],
            'name' => ['required', 'string', 'max:255'],
            'exam_type' => ['required', Rule::in(['quiz', 'midterm', 'final', 'mock', 'other'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', Rule::in(['draft', 'scheduled', 'completed', 'published'])],
        ];
    }
}
