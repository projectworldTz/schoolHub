<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WebsiteDownloadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['prospectus', 'admission_form', 'fee_structure', 'academic_calendar', 'school_rules', 'uniform_guide', 'other'])],
            'file' => [$this->isMethod('post') ? 'required' : 'nullable', 'file', 'max:10240'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
