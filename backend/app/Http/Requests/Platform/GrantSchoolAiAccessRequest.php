<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class GrantSchoolAiAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageAi', $this->route('school'));
    }

    public function rules(): array
    {
        return [
            'activated_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:activated_at'],
            'monthly_request_limit' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
