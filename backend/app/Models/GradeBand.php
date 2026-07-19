<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A score band within a grading system (e.g. "A" = 80-100). Not
 * independently tenant-scoped — always reached through an already
 * tenant-scoped GradingSystem.
 */
class GradeBand extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'grading_system_id',
        'label',
        'min_score',
        'max_score',
        'remark',
        'gpa',
    ];

    protected function casts(): array
    {
        return [
            'min_score' => 'integer',
            'max_score' => 'integer',
            'gpa' => 'decimal:2',
        ];
    }

    public function gradingSystem(): BelongsTo
    {
        return $this->belongsTo(GradingSystem::class);
    }
}
