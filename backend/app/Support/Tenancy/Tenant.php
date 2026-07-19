<?php

namespace App\Support\Tenancy;

use Closure;

/**
 * Single source of truth for "which school is this request operating as".
 *
 * MySQL has no equivalent to Postgres Row-Level Security, so unlike an
 * RLS-backed design, tenant isolation here is enforced ONLY at the
 * application layer: the Eloquent global scope in BelongsToSchool reads
 * Tenant::id() (and Tenant::isPlatformMode()) on every query. There is no
 * database-level backstop — a query that bypasses Eloquent (raw DB::table()
 * calls, a forgotten scope) is not protected. Keep tenant-scoped data
 * access going through Eloquent models that use BelongsToSchool.
 *
 * Role/permission checks (Spatie) are NOT scoped through this class —
 * Spatie's teams feature is deliberately off (see config/permission.php).
 * A role like "Teacher" is one global definition reused by every school;
 * which school a given assignment belongs to is implied by the assigned
 * user's own school_id, not by the role.
 */
class Tenant
{
    protected static ?string $currentSchoolId = null;

    protected static bool $platformMode = false;

    public static function id(): ?string
    {
        return static::$currentSchoolId;
    }

    public static function check(): bool
    {
        return static::$currentSchoolId !== null;
    }

    public static function isPlatformMode(): bool
    {
        return static::$platformMode;
    }

    public static function set(?string $schoolId): void
    {
        static::$currentSchoolId = $schoolId;
    }

    /**
     * Run a callback with the tenant global scope suspended entirely
     * (every school's rows visible). Reserved for Super Admin (Platform)
     * code paths that legitimately need cross-tenant visibility (e.g.
     * platform analytics, resolving a user before their tenant is known),
     * and for CLI contexts such as seeders.
     *
     * Callers are responsible for having already authorized the caller as
     * Super Admin before reaching for this; it is a data-access escape
     * hatch, not an authorization check.
     */
    public static function runAsPlatform(Closure $callback): mixed
    {
        $previous = static::$platformMode;
        static::$platformMode = true;

        try {
            return $callback();
        } finally {
            static::$platformMode = $previous;
        }
    }
}
