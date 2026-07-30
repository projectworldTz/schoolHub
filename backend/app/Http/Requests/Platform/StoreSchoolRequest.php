<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\School::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:schools,slug'],
            'type' => ['required', Rule::in([
                'nursery', 'primary', 'secondary', 'college', 'university', 'vocational', 'other',
            ])],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'size:2'],
            'timezone' => ['nullable', 'timezone'],
            'currency' => ['nullable', 'string', 'size:3'],
            'subscription_plan' => ['nullable', 'string', 'max:100'],

            // How long this school's license runs from today — the Super
            // Admin picks one of these on every school they register;
            // there's no silent default anymore (see SchoolService::create()).
            'license_duration_months' => ['required', Rule::in([1, 3, 6, 12])],

            // The school's first user (School Owner role) — created in the
            // same request. No password field: SchoolService::create()
            // generates one, emails an activation link, and the owner sets
            // their own password on first use of that link.
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
