<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class GenerateExamPaperRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exam-marks.record') || $this->user()->can('exams.manage');
    }

    public function rules(): array
    {
        return [
            // Existence only — the controller/service re-fetch both via
            // Eloquent (tenant-scoped through BelongsToSchool), so an id
            // belonging to another school still 404s there regardless of
            // what this rule already confirmed.
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'title' => ['required', 'string', 'max:255'],
            'exam_date' => ['nullable', 'date'],
            'duration_minutes' => ['required', 'integer', 'min:20', 'max:240'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.type' => ['required', 'in:multiple_choice,matching,short_answer'],
            'sections.*.count' => ['required', 'integer', 'min:1', 'max:50'],
            'sections.*.marks_per_question' => ['required', 'integer', 'min:1', 'max:50'],
        ];
    }
}
