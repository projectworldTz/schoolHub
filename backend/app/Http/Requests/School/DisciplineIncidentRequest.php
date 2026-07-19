<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class DisciplineIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('discipline.manage');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'incident_date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:120'],
            'severity' => ['required', 'in:minor,moderate,major'],
            'description' => ['required', 'string'],
            'action_taken' => ['nullable', 'string'],
            'status' => ['nullable', 'in:open,resolved'],
        ];
    }
}
