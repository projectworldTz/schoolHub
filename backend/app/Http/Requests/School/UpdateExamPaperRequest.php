<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamPaperRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exam-marks.record') || $this->user()->can('exams.manage');
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'exam_date' => ['sometimes', 'nullable', 'date'],
            'duration_minutes' => ['sometimes', 'integer', 'min:20', 'max:240'],
            'instructions' => ['sometimes', 'nullable', 'string', 'max:2000'],
            // Per-question fields vary by section 'type' (multiple_choice /
            // matching / short_answer — see ExamPaper's documented JSON
            // shape), so only the type-agnostic structure is validated here;
            // the teacher-facing editor is what constrains the rest.
            'sections' => ['sometimes', 'array', 'min:1'],
            'sections.*.type' => ['required_with:sections', 'in:multiple_choice,matching,short_answer'],
            'sections.*.title' => ['required_with:sections', 'string', 'max:255'],
        ];
    }
}
