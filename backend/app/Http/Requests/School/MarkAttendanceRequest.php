<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('attendance.manage');
    }

    public function rules(): array
    {
        return [
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'stream_id' => ['nullable', 'uuid', 'exists:streams,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'uuid', 'exists:students,id'],
            'records.*.status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
