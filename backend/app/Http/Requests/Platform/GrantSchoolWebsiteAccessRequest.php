<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class GrantSchoolWebsiteAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageWebsite', $this->route('school'));
    }

    public function rules(): array
    {
        return [
            'activated_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:activated_at'],
        ];
    }
}
