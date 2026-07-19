<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class GenerateLessonPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('ai-assistant.use');
    }

    public function rules(): array
    {
        return [
            // Existence only — the controller re-fetches both via Eloquent
            // (tenant-scoped through BelongsToSchool), so an id belonging
            // to another school still 404s there even though this rule
            // itself queries un-scoped.
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'topic' => ['required', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:10', 'max:240'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
