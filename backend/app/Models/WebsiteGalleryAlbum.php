<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteGalleryAlbum extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'website_gallery_albums';

    protected $attributes = [
        'category' => 'campus',
        'sort_order' => 0,
    ];

    protected $fillable = [
        'school_id',
        'name',
        'category',
        'sort_order',
    ];

    public function images(): HasMany
    {
        return $this->hasMany(WebsiteGalleryImage::class);
    }
}
