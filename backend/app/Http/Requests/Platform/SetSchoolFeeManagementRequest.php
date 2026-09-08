<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class SetSchoolFeeManagementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageFees', $this->route('school'));
    }

    public function rules(): array
    {
        return ['fee_management_enabled' => ['required', 'boolean']];
    }
}
