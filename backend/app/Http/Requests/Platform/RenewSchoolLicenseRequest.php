<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RenewSchoolLicenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('school'));
    }

    public function rules(): array
    {
        return [
            'months' => ['required', Rule::in([1, 3, 6, 12])],
        ];
    }
}
