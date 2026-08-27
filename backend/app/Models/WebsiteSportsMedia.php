<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteSportsMedia extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    public const TYPES = ['image', 'video'];

    protected $attributes = [
        'sort_order' => 0,
        'is_visible' => true,
    ];

    protected $fillable = [
        'school_id',
        'media_type',
        'file_path',
        'caption',
        'is_visible',
        'sort_order',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
    ];
}
