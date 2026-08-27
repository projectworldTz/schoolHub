<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteResearchProject extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    public const CATEGORIES = ['research', 'project'];

    protected $attributes = [
        'sort_order' => 0,
        'is_visible' => true,
    ];

    protected $fillable = [
        'school_id',
        'title',
        'category',
        'description',
        'status',
        'image_path',
        'link_url',
        'is_visible',
        'sort_order',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
    ];
}
