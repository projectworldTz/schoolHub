<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 2 (Students, Staff/Teachers,
 * Admissions). Leave requests are deliberately NOT gated behind
 * 'staff.manage' for creation — any authenticated staff member can submit
 * their own; 'staff.manage' is only required to review/approve someone
 * else's, enforced in the controller rather than a separate permission.
 */
class Phase2PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'students.manage',
        'staff.manage',
        'admissions.manage',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Principal' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Vice Principal' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Academic Master' => ['students.manage'],
        'Registrar' => ['students.manage', 'admissions.manage'],
        'Admissions Officer' => ['admissions.manage'],
        'HR Officer' => ['staff.manage'],

        'Head Teacher' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Vice Chancellor' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Deputy Head Teacher' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Second Master' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Deputy Vice Chancellor' => ['students.manage', 'staff.manage', 'admissions.manage'],
        'Head of Department' => ['students.manage'],
        'Dean of Students' => ['students.manage'],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            Role::findByName($role, 'web')->givePermissionTo($permissions);
        }
    }
}
