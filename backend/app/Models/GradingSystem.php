<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GradingSystem extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'is_default',
        'necta_enabled',
        'points_subject_count',
        'division_rules',
        'assessment_weights',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'necta_enabled' => 'boolean',
            'points_subject_count' => 'integer',
            'division_rules' => 'array',
            'assessment_weights' => 'array',
        ];
    }

    public function gradeBands(): HasMany
    {
        return $this->hasMany(GradeBand::class)->orderByDesc('min_score');
    }
}
