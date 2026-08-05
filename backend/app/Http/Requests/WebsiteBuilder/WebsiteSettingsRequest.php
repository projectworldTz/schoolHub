<?php

namespace App\Http\Requests\WebsiteBuilder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WebsiteSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the 'website-builder.access' route middleware
    }

    public function rules(): array
    {
        return [
            'theme_key' => ['sometimes', 'required', Rule::in(array_keys(config('website_themes')))],
            'primary_color' => ['nullable', 'string', 'max:20'],
            'motto' => ['nullable', 'string', 'max:255'],
            'principal_name' => ['nullable', 'string', 'max:255'],
            'principal_message' => ['nullable', 'string', 'max:2000'],
            'mission' => ['nullable', 'string', 'max:2000'],
            'vision' => ['nullable', 'string', 'max:2000'],
            'core_values' => ['nullable', 'string', 'max:2000'],
            'stats_visibility' => ['sometimes', 'required', Rule::in(['publish', 'hide', 'summary_only'])],
            'admission_status' => ['sometimes', 'required', Rule::in(['open', 'closed'])],
            'admission_open_date' => ['nullable', 'date'],
            'admission_close_date' => ['nullable', 'date', 'after_or_equal:admission_open_date'],
            'admission_requirements' => ['nullable', 'string', 'max:5000'],
            'facebook_url' => ['nullable', 'url', 'max:255'],
            'twitter_url' => ['nullable', 'url', 'max:255'],
            'instagram_url' => ['nullable', 'url', 'max:255'],
            'youtube_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'whatsapp_number' => ['nullable', 'string', 'max:30'],
            'google_maps_embed_url' => ['nullable', 'url', 'max:2000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'custom_css' => ['nullable', 'string', 'max:20000'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
