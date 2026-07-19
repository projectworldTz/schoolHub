<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransportRoute extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'vehicle_registration',
        'driver_name',
        'driver_phone',
        'capacity',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class)->where('status', 'active');
    }
}
