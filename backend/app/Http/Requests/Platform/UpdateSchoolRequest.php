<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('school'));
    }

    public function rules(): array
    {
        $school = $this->route('school');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', 'alpha_dash', Rule::unique('schools', 'slug')->ignore($school)],
            'type' => ['sometimes', 'required', Rule::in([
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
            // Free-form correction only — the normal way to extend a
            // license is POST schools/{school}/renew-license (see
            // RenewSchoolLicenseRequest), which extends from today rather
            // than requiring the admin to compute a date by hand.
            'license_expires_at' => ['nullable', 'date'],
        ];
    }
}
