<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteAcademicDepartmentInfo extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'website_academic_department_info';

    protected $attributes = [
        'sort_order' => 0,
        'is_visible' => false,
    ];

    protected $fillable = [
        'school_id',
        'department_id',
        'public_description',
        'is_visible',
        'sort_order',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
