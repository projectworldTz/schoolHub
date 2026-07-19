<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimetablePeriod extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $attributes = [
        'sort_order' => 0,
        'is_break' => false,
    ];

    protected $fillable = [
        'school_id',
        'name',
        'start_time',
        'end_time',
        'sort_order',
        'is_break',
    ];

    protected function casts(): array
    {
        return [
            'is_break' => 'boolean',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(TimetableEntry::class);
    }
}
