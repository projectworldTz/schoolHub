<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteGalleryImage extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'website_gallery_images';

    protected $attributes = [
        'sort_order' => 0,
    ];

    protected $fillable = [
        'school_id',
        'website_gallery_album_id',
        'image_path',
        'caption',
        'sort_order',
    ];

    public function album(): BelongsTo
    {
        return $this->belongsTo(WebsiteGalleryAlbum::class, 'website_gallery_album_id');
    }
}
