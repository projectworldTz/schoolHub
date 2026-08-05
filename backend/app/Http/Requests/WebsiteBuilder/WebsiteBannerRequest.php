<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;

class WebsiteBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'image' => [$this->isMethod('post') ? 'required' : 'nullable', 'image', 'max:5120'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'url', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
