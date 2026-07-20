<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Seeds the role vocabulary defined in the platform spec. Each is a single
 * global role definition — e.g. one "Teacher" row reused by every school.
 * Which school a given assignment applies to is implied by the assigned
 * user's own school_id (see App\Models\Concerns\BelongsToSchool), not by
 * the role itself — Spatie's teams feature is deliberately off (see
 * config/permission.php for why).
 *
 * Permissions are intentionally NOT seeded here for every future module —
 * they're added incrementally as each module in ROADMAP.md is built, and
 * attached to the relevant roles at that point. Super Admin bypasses
 * permission checks entirely via the Gate::before hook in AppServiceProvider,
 * so it needs no explicit permissions.
 */
class RolesAndPermissionsSeeder extends Seeder
{
    protected const SCHOOL_ROLES = [
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
        'Student',
        'Parent',
        'Librarian',
        'Hostel Warden',
        'Transport Officer',
        'Nurse',
        'Receptionist',
        'Store Keeper',
        'Security Officer',

        // Per-school-type leadership/teaching titles — see
        // config/school_roles.php and App\Support\SchoolRoles for which of
        // these each school type actually offers.
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
        Role::findOrCreate('Super Admin', 'web');

        foreach (self::SCHOOL_ROLES as $role) {
            Role::findOrCreate($role, 'web');
        }
    }
}
