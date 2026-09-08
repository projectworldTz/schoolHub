<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class SetSchoolFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageFeatures', $this->route('school'));
    }

    public function rules(): array
    {
        return ['enabled' => ['required', 'boolean']];
    }
}
