<?php

namespace App\Models;

use App\Support\Tenancy\Tenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'custom_domain',
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
        'license_expires_at',
        'approved_at',
        'suspended_at',
        'suspension_reason',
        'ai_enabled',
        'ai_activated_at',
        'ai_expires_at',
        'ai_suspended_at',
        'ai_suspension_reason',
        'ai_monthly_request_limit',
        'ai_access_updated_by',
    ];

    protected function casts(): array
    {
        return [
            'license_expires_at' => 'datetime',
            'approved_at' => 'datetime',
            'suspended_at' => 'datetime',
            'ai_enabled' => 'boolean',
            'ai_activated_at' => 'datetime',
            'ai_expires_at' => 'datetime',
            'ai_suspended_at' => 'datetime',
        ];
    }

    /**
     * Derived, not stored — mirrors how frontend/src/lib/license.ts computes
     * a license tier from license_expires_at alone rather than persisting a
     * second status column that could drift out of sync with the raw dates.
     */
    public function aiAccessStatus(): string
    {
        if (! $this->ai_enabled || ! $this->ai_activated_at || $this->ai_activated_at->isFuture()) {
            // Covers "never granted" and "granted with a future activation
            // date" — Phase 1 doesn't surface a separate "scheduled" state.
            return 'not_granted';
        }

        if ($this->ai_suspended_at) {
            return 'suspended';
        }

        if ($this->ai_expires_at && $this->ai_expires_at->isPast()) {
            return 'expired';
        }

        return 'active';
    }

    /**
     * Counted straight from ai_audit_logs — no separate usage counter to
     * keep in sync. Tenant::runAsPlatform() because this can be called from
     * a Platform (Super Admin) request context that has no school_id of its
     * own; see App\Support\Tenancy\Tenant.
     */
    public function aiRequestsThisMonth(): int
    {
        return Tenant::runAsPlatform(fn () => AiAuditLog::where('school_id', $this->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count());
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function guardians(): HasMany
    {
        return $this->hasMany(Guardian::class);
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class)->whereHas(
            'roles',
            fn ($query) => $query->where('name', 'School Owner')
        );
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
