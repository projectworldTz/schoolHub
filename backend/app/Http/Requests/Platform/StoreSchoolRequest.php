<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

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
            'trial_ends_at' => ['nullable', 'date'],

            // The school's first user (School Owner role) — created in the
            // same request. No invite-email flow yet (same as
            // CreateSchoolUserRequest for staff): the Super Admin sets the
            // initial password directly and shares it out of band.
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_password' => ['required', Password::defaults()],
        ];
    }
}
