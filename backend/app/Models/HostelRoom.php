<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class HostelRoom extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'type' => 'mixed',
        'capacity' => 1,
    ];

    protected $fillable = [
        'school_id',
        'name',
        'type',
        'capacity',
    ];

    public function allocations(): HasMany
    {
        return $this->hasMany(HostelAllocation::class);
    }

    public function activeAllocations(): HasMany
    {
        return $this->hasMany(HostelAllocation::class)->where('status', 'active');
    }
}
