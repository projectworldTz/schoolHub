<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class SchoolPaymentAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('school-settings.manage');
    }

    public function rules(): array
    {
        return [
            'account_name' => ['required', 'string', 'max:255'],
            // String, not numeric — bank/mobile money account numbers can
            // carry leading zeros or non-digit characters.
            'account_number' => ['required', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:10'],
        ];
    }
}
