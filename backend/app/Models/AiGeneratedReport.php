<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGeneratedReport extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $fillable = [
        'school_id',
        'user_id',
        'report_type',
        'title',
        'format',
        'file_path',
        'file_size',
        'filters',
        'status',
        'failure_reason',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'file_size' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
