<?php

namespace App\Http\Resources\WebsiteBuilder;

use App\Services\WebsiteBuilder\WebsiteMediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WebsiteSettings */
class WebsiteSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $media = app(WebsiteMediaService::class);

        return [
            'id' => $this->id,
            'theme_key' => $this->theme_key,
            'theme' => config("website_themes.{$this->theme_key}"),
            'primary_color' => $this->primary_color,
            'motto' => $this->motto,
            'principal_name' => $this->principal_name,
            'principal_message' => $this->principal_message,
            'mission' => $this->mission,
            'vision' => $this->vision,
            'core_values' => $this->core_values,
            'hero_image_path' => $this->hero_image_path,
            'hero_image_url' => $media->url($this->hero_image_path),
            'hero_video_path' => $this->hero_video_path,
            'hero_video_url' => $media->url($this->hero_video_path),
            'stats_visibility' => $this->stats_visibility,
            'admission_status' => $this->admission_status,
            'admission_open_date' => $this->admission_open_date,
            'admission_close_date' => $this->admission_close_date,
            'admission_requirements' => $this->admission_requirements,
            'facebook_url' => $this->facebook_url,
            'twitter_url' => $this->twitter_url,
            'instagram_url' => $this->instagram_url,
            'youtube_url' => $this->youtube_url,
            'linkedin_url' => $this->linkedin_url,
            'whatsapp_number' => $this->whatsapp_number,
            'google_maps_embed_url' => $this->google_maps_embed_url,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'custom_css' => $this->custom_css,
            'is_published' => $this->is_published,
        ];
    }
}
