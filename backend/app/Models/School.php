<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * The tenant registry entry. Deliberately NOT tenant-scoped itself — this
 * is the table the Super Admin (Platform) layer manages directly, and the
 * table every other tenant-scoped model's school_id points back to.
 */
class School extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'status',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'timezone',
        'currency',
        'logo_path',
        'subscription_plan',
        'trial_ends_at',
        'approved_at',
        'suspended_at',
        'suspension_reason',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'approved_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function schoolClasses(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function gradingSystems(): HasMany
    {
        return $this->hasMany(GradingSystem::class);
    }
}
