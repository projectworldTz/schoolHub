<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;

class WebsiteFacilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'icon_key' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'image', 'max:5120'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
