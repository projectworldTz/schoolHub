<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteDownload extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'category' => 'other',
        'file_size' => 0,
        'download_count' => 0,
        'sort_order' => 0,
    ];

    protected $fillable = [
        'school_id',
        'title',
        'category',
        'file_path',
        'file_size',
        'download_count',
        'sort_order',
    ];
}
