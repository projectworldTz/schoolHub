<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;

class WebsiteNewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
