<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebsiteSettings extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $table = 'website_settings';

    /**
     * Mirrors the DB column defaults (same reasoning as Student::$attributes)
     * so a row created via firstOrCreate() in WebsiteSettingsController
     * reflects these immediately instead of showing null until re-fetched.
     */
    protected $attributes = [
        'theme_key' => 'modern',
        'stats_visibility' => 'summary_only',
        'admission_status' => 'closed',
        'is_published' => false,
    ];

    protected $fillable = [
        'school_id',
        'theme_key',
        'primary_color',
        'motto',
        'principal_name',
        'principal_message',
        'mission',
        'vision',
        'core_values',
        'hero_image_path',
        'hero_video_path',
        'stats_visibility',
        'admission_status',
        'admission_open_date',
        'admission_close_date',
        'admission_requirements',
        'facebook_url',
        'twitter_url',
        'instagram_url',
        'youtube_url',
        'linkedin_url',
        'whatsapp_number',
        'google_maps_embed_url',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'custom_css',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'admission_open_date' => 'date',
            'admission_close_date' => 'date',
            'is_published' => 'boolean',
        ];
    }
}
