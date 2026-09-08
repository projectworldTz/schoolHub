<?php

namespace App\Http\Requests\Platform;

use App\Services\School\SchoolFeatureAccess;
use Illuminate\Foundation\Http\FormRequest;

class SetSchoolFeaturesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageFeatures', $this->route('school'));
    }

    public function rules(): array
    {
        $rules = [];
        foreach (SchoolFeatureAccess::FEATURES as $feature => $label) {
            $rules[$feature.'_enabled'] = ['required', 'boolean'];
        }

        return $rules;
    }
}
