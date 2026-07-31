<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // No 'exists:users,email' — see ActivateAccountRequest; this is
            // a public endpoint and an existence check would let a caller
            // enumerate registered emails for free.
            'email' => ['required', 'email'],
        ];
    }
}
