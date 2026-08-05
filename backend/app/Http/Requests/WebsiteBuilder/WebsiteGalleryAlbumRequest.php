<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WebsiteGalleryAlbumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['campus', 'students', 'laboratories', 'sports', 'graduation', 'school_life'])],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
