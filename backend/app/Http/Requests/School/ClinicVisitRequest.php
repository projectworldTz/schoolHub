<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class ClinicVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('clinic.manage');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'visit_date' => ['required', 'date'],
            'reason' => ['required', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'treatment' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
        ];
    }
}
