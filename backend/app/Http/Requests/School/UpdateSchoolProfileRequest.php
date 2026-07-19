<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

/**
 * A school admin editing their OWN school's profile — deliberately excludes
 * fields the Super Admin (Platform) layer owns: slug, status,
 * subscription_plan, trial_ends_at, approval/suspension state.
 */
class UpdateSchoolProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('school-settings.manage');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'size:2'],
            'timezone' => ['nullable', 'timezone'],
            'currency' => ['nullable', 'string', 'size:3'],
        ];
    }
}
