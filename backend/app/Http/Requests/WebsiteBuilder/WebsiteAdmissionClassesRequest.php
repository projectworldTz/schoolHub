<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;

class WebsiteAdmissionClassesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'classes' => ['required', 'array', 'min:1'],
            'classes.*.school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'classes.*.summary' => ['nullable', 'string', 'max:255'],
            'classes.*.requirements' => ['nullable', 'string', 'max:5000'],
            'classes.*.is_visible' => ['required', 'boolean'],
            'classes.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
