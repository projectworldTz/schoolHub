<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;

class WebsiteAcademicDepartmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'departments' => ['required', 'array', 'min:1'],
            'departments.*.department_id' => ['required', 'uuid', 'exists:departments,id'],
            'departments.*.public_description' => ['nullable', 'string', 'max:5000'],
            'departments.*.is_visible' => ['required', 'boolean'],
            'departments.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
