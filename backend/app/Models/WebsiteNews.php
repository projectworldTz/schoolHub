<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebsiteNews extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $table = 'website_news';

    protected $attributes = [
        'is_featured' => false,
        'sort_order' => 0,
    ];

    protected $fillable = [
        'school_id',
        'announcement_id',
        'is_featured',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
        ];
    }

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }
}
