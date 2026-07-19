<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class GraduationBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('graduation.manage');
    }

    public function rules(): array
    {
        return [
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['uuid', 'exists:students,id'],
            'to_status' => ['required', 'in:graduated,transferred,withdrawn'],
            'effective_date' => ['required', 'date'],
            'reason' => ['nullable', 'string'],
        ];
    }
}
