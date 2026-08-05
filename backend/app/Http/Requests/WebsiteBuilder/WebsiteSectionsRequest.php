<?php

namespace App\Http\Requests\WebsiteBuilder;

use App\Models\WebsiteSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WebsiteSectionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.section_key' => ['required', Rule::in(WebsiteSection::KEYS)],
            'sections.*.is_visible' => ['required', 'boolean'],
            'sections.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
