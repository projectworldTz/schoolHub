<?php

namespace App\Http\Requests\School;

use App\Support\SchoolRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Creates a staff account within the admin's own school. No invite-email
 * flow yet (that belongs with Communication in Phase 3) — the admin sets
 * an initial password directly and shares it with the new user out of band.
 */
class CreateSchoolUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.manage');
    }

    public function rules(): array
    {
        $allowedRoles = SchoolRoles::forType($this->user()->school?->type);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::defaults()],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::in($allowedRoles)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
