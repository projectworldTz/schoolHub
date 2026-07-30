<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ActivateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // No 'exists:users,email' here — this is a public,
            // unauthenticated endpoint; Password::broker()->reset() below
            // already handles an unknown email as just another invalid-token
            // failure, and adding a validation-level existence check would
            // let a caller enumerate registered emails for free.
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', Password::defaults()],
        ];
    }
}
