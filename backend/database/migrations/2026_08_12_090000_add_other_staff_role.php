<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

/**
 * Adds the "Other" staff role to every school type's catalog (see
 * config/school_roles.php and RolesAndPermissionsSeeder::SCHOOL_ROLES).
 * A plain re-run of RolesAndPermissionsSeeder would do this too, but
 * deploy.sh only runs `migrate --force`, not seeders (see
 * Phase9PermissionsSeeder's deploy-gap note) — a migration is the only way
 * this actually lands on production without a manual seed step.
 */
return new class extends Migration
{
    public function up(): void
    {
        Role::findOrCreate('Other', 'web');
    }

    public function down(): void
    {
        Role::where('name', 'Other')->where('guard_name', 'web')->delete();
    }
};
