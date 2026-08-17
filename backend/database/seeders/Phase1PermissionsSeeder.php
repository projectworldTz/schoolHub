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
        // Manager is a full operational deputy for the School Owner — same
        // permission set as School Owner across every phase, minus the
        // owner-only protections enforced in SchoolUserController (a
        // Manager can't suspend/remove the School Owner account).
        'Manager' => ['school-settings.manage', 'classes.manage', 'subjects.manage', 'users.manage'],

        // Per-school-type equivalents of the roles above — same bundle,
        // see App\Support\SchoolRoles for which type offers which.
        // Head Teacher is scoped to academics only (classes/subjects) —
        // school-settings.manage and users.manage moved to Manager, the
        // role that owns non-academic school operations.
        'Head Teacher' => ['classes.manage', 'subjects.manage'],
        'Vice Chancellor' => ['school-settings.manage', 'classes.manage', 'subjects.manage', 'users.manage'],
        'Deputy Head Teacher' => ['classes.manage', 'subjects.manage', 'users.manage'],
        'Second Master' => ['classes.manage', 'subjects.manage', 'users.manage'],
        'Deputy Vice Chancellor' => ['classes.manage', 'subjects.manage', 'users.manage'],
        'Head of Department' => ['classes.manage', 'subjects.manage'],
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
