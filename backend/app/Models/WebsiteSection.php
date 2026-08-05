<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebsiteSection extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $table = 'website_sections';

    /**
     * The full, ordered set of sections a public site can render. Used both
     * to seed a school's default row set and to validate section_key.
     */
    public const KEYS = [
        'hero', 'about', 'stats', 'facilities', 'gallery',
        'news', 'admissions', 'calendar', 'testimonials', 'contact',
    ];

    protected $attributes = [
        'is_visible' => true,
        'sort_order' => 0,
    ];

    protected $fillable = [
        'school_id',
        'section_key',
        'is_visible',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_visible' => 'boolean',
        ];
    }
}
