<?php

namespace App\Http\Requests\School;

use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('staff.manage');
    }

    /**
     * Two shapes: a login-backed staff member (user_id, pointing at an
     * existing account — name/phone come from that User and are ignored
     * here) or a no-login record for support staff who'll never sign in
     * (name required instead, phone optional, no user_id at all).
     *
     * required_without only applies on create: on update, a caller might
     * legitimately send neither field (e.g. changing just the branch) and
     * that must not fail just because the request didn't repeat whichever
     * of user_id/name was already set on the existing row — 'sometimes'
     * skips validation (and exclusion from validated()) entirely for a
     * field that's simply absent from this particular request.
     */
    public function rules(): array
    {
        $schoolId = Tenant::id();
        $creating = $this->isMethod('POST');

        return [
            'user_id' => [
                $creating ? 'required_without:name' : 'sometimes',
                'nullable', 'uuid',
                Rule::exists('users', 'id')->where('school_id', $schoolId),
                Rule::unique('staff_profiles', 'user_id')->ignore($this->route('staff')),
            ],
            'name' => [
                $creating ? 'required_without:user_id' : 'sometimes',
                'nullable', 'string', 'max:255',
            ],
            'phone' => ['nullable', 'string', 'max:30'],
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
