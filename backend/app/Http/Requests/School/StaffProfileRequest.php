<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('staff.manage');
    }

    public function rules(): array
    {
        $schoolId = $this->user()->school_id;

        return [
            'user_id' => [
                'required', 'uuid',
                Rule::exists('users', 'id')->where('school_id', $schoolId),
                Rule::unique('staff_profiles', 'user_id')->ignore($this->route('staff')),
            ],
            'department_id' => [
                'nullable', 'uuid',
                Rule::exists('departments', 'id')->where('school_id', $schoolId),
            ],
            'branch_id' => [
                'nullable', 'uuid',
                Rule::exists('branches', 'id')->where('school_id', $schoolId),
            ],
            'staff_number' => [
                'required', 'string', 'max:50',
                Rule::unique('staff_profiles', 'staff_number')
                    ->where('school_id', $schoolId)
                    ->ignore($this->route('staff')),
            ],
            'job_title' => ['nullable', 'string', 'max:255'],
            'employment_type' => ['sometimes', Rule::in(['full_time', 'part_time', 'contract'])],
            'hire_date' => ['nullable', 'date'],
            'termination_date' => ['nullable', 'date', 'after:hire_date'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
