<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 1 (School Management, Class
 * Management, Academic Management, User & Role management). Read access to
 * this reference data (GET endpoints) is open to any authenticated user of
 * the school — these permissions gate writes only. Super Admin bypasses
 * all of this via the Gate::before hook in AppServiceProvider.
 */
class Phase1PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'school-settings.manage',
        'classes.manage',
        'subjects.manage',
        'users.manage',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['school-settings.manage', 'classes.manage', 'subjects.manage', 'users.manage'],
        'Principal' => ['school-settings.manage', 'classes.manage', 'subjects.manage', 'users.manage'],
        'Vice Principal' => ['classes.manage', 'subjects.manage', 'users.manage'],
        'Academic Master' => ['classes.manage', 'subjects.manage'],
        'Registrar' => ['classes.manage'],
        'HR Officer' => ['users.manage'],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // givePermissionTo (not syncPermissions): additive, so a later
        // phase's seeder can't accidentally wipe out permissions an
        // earlier phase granted the same role.
        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            Role::findByName($role, 'web')->givePermissionTo($permissions);
        }
    }
}
