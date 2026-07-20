<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permission introduced by the AI Assistant module (chat + lesson-plan
 * generation). Granted broadly to every staff-facing role — it's a general
 * productivity tool, not something tied to one department's data the way
 * finance.manage or exams.manage are. Deliberately excludes Student and
 * Parent, who use their own dedicated portals rather than the internal
 * /app module grid this sits in.
 */
class Phase8PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'ai-assistant.use',
    ];

    protected const ROLES = [
        'School Owner',
        'Principal',
        'Vice Principal',
        'Academic Master',
        'Registrar',
        'Admissions Officer',
        'Accountant',
        'Bursar',
        'HR Officer',
        'Teacher',
        'Class Teacher',
        'Librarian',
        'Hostel Warden',
        'Transport Officer',
        'Nurse',
        'Receptionist',
        'Store Keeper',
        'Security Officer',

        'Head Teacher',
        'Deputy Head Teacher',
        'Discipline Master',
        'Subject Teacher',
        'Second Master',
        'Vice Chancellor',
        'Deputy Vice Chancellor',
        'Dean of Students',
        'Head of Department',
        'Lecturer',
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLES as $role) {
            Role::findByName($role, 'web')->givePermissionTo(self::PERMISSIONS);
        }
    }
}
