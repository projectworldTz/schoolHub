<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // auth:web has already put a user on the request by the time this
        // route is reached.
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', Password::defaults()],
        ];
    }
}
