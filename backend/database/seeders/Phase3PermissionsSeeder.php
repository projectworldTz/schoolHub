<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 3 (Attendance, Timetable,
 * Homework, Communication). 'attendance.manage' and 'homework.manage' are
 * granted broadly to 'Teacher' since marking attendance / setting homework
 * for a class you teach is routine teacher work, not an admin function —
 * finer-grained "only for classes you're assigned to" scoping is enforced
 * in the controllers via teacher_subject / timetable_entries, not a
 * separate permission. 'timetable.manage' and 'announcements.manage' stay
 * with school leadership since they affect the whole school, not one class.
 */
class Phase3PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'attendance.manage',
        'timetable.manage',
        'homework.manage',
        'announcements.manage',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['attendance.manage', 'timetable.manage', 'homework.manage', 'announcements.manage'],
        'Principal' => ['attendance.manage', 'timetable.manage', 'homework.manage', 'announcements.manage'],
        'Vice Principal' => ['attendance.manage', 'timetable.manage', 'homework.manage', 'announcements.manage'],
        'Academic Master' => ['attendance.manage', 'timetable.manage', 'homework.manage', 'announcements.manage'],
        'Class Teacher' => ['attendance.manage', 'homework.manage', 'announcements.manage'],
        'Teacher' => ['attendance.manage', 'homework.manage'],
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
