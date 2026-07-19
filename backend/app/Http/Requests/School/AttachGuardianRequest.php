<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Either link an existing guardian (guardian_id) or create a new one
 * inline (name + contact fields) — covers both "sibling already has a
 * guardian on file" and "first child at this school" without two endpoints.
 */
class AttachGuardianRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('students.manage');
    }

    public function rules(): array
    {
        return [
            'guardian_id' => [
                'nullable', 'uuid',
                Rule::exists('guardians', 'id')->where('school_id', $this->user()->school_id),
            ],
            'name' => ['required_without:guardian_id', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'relationship' => ['required', 'string', 'max:50'],
            'is_primary' => ['sometimes', 'boolean'],
            'is_emergency_contact' => ['sometimes', 'boolean'],
        ];
    }
}
