<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class RecordExamMarksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exam-marks.record');
    }

    public function rules(): array
    {
        return [
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'uuid', 'exists:students,id'],
            'records.*.marks_obtained' => ['nullable', 'numeric', 'min:0'],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
