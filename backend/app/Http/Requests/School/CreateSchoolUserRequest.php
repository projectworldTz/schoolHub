<?php

namespace App\Http\Requests\School;

use App\Models\School;
use App\Support\SchoolRoles;
use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creates a staff account within the admin's own school. No password is
 * collected here — SchoolUserController::store() generates one the admin
 * never sees and emails an activation link instead, same as
 * TeacherImportService/GuardianImportService's bulk-import flows.
 */
class CreateSchoolUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.manage');
    }

    public function rules(): array
    {
        $allowedRoles = SchoolRoles::forType(School::find(Tenant::id())?->type);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::in($allowedRoles)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
