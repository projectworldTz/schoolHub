<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebsitePageView extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $table = 'website_page_views';

    public $timestamps = false;

    protected $fillable = [
        'school_id',
        'event_type',
        'section_key',
        'referrer',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (WebsitePageView $view) {
            $view->created_at ??= now();
        });
    }
}
