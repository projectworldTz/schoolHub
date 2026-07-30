<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SetSchoolCustomDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('school'));
    }

    protected function prepareForValidation(): void
    {
        if (! is_string($this->custom_domain)) {
            return;
        }

        // Forgive a pasted full URL ("https://school.co.tz/") — store just
        // the bare hostname, since that's what the Host header comparison
        // in ResolveTenantFromUser matches against.
        $domain = trim($this->custom_domain);
        $domain = preg_replace('#^https?://#i', '', $domain);
        $domain = rtrim(explode('/', $domain)[0], '.');

        $this->merge(['custom_domain' => $domain !== '' ? strtolower($domain) : null]);
    }

    public function rules(): array
    {
        return [
            'custom_domain' => [
                'nullable', 'string', 'max:255',
                'regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i',
                Rule::unique('schools', 'custom_domain')->ignore($this->route('school')),
            ],
        ];
    }
}
