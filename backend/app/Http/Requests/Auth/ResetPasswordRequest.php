<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // No 'exists:users,email' — see ActivateAccountRequest; this is
            // a public, unauthenticated endpoint.
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', Password::defaults()],
        ];
    }
}
