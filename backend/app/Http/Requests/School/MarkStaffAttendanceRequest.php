<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkStaffAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('staff.manage');
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.user_id' => ['required', 'uuid', 'exists:users,id'],
            'records.*.status' => ['required', Rule::in(['present', 'absent', 'late', 'excused', 'on_leave'])],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
