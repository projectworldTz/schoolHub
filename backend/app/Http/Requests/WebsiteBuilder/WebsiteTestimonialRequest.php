<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WebsiteTestimonialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'author_name' => ['required', 'string', 'max:255'],
            'author_role' => ['required', Rule::in(['parent', 'student', 'alumni'])],
            'message' => ['required', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
