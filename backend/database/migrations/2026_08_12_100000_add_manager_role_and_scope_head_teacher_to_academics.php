<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Splits Head Teacher's permissions: it keeps only academics
 * (classes/subjects/students/attendance/timetable/homework/exams/
 * exam-marks/lms/graduation/discipline/analytics/announcements/
 * ai-assistant), and a new "Manager" role picks up everything operational
 * it used to hold (finance, staff/HR, admissions, settings, users, audit
 * log, facilities, website builder) — see Phase1/2/5/6/7/8/9
 * PermissionsSeeder for the same split applied to fresh seeds.
 *
 * Only touches the roles/role_has_permissions tables — no User, Student,
 * StaffProfile, or other business-data row is read or written, and no
 * existing role or user-role assignment is deleted. The one real
 * consequence: any account currently holding Head Teacher loses access to
 * the moved permissions the moment this runs, until someone is given the
 * new Manager role. Done directly here (not just in the seeders) because
 * deploy.sh only runs `migrate`, never `db:seed` — see
 * Phase9PermissionsSeeder's deploy-gap note.
 */
return new class extends Migration
{
    private const MOVED_TO_MANAGER = [
        'school-settings.manage',
        'users.manage',
        'staff.manage',
        'admissions.manage',
        'finance.manage',
        'expenses.manage',
        'library.manage',
        'hostel.manage',
        'transport.manage',
        'inventory.manage',
        'clinic.manage',
        'cafeteria.manage',
        'audit-log.view',
        'website-builder.manage',
    ];

    public function up(): void
    {
        foreach (self::MOVED_TO_MANAGER as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        Permission::findOrCreate('ai-assistant.use', 'web');

        $manager = Role::findOrCreate('Manager', 'web');
        $manager->givePermissionTo(self::MOVED_TO_MANAGER);
        $manager->givePermissionTo('ai-assistant.use');

        // Role may not exist yet if this runs before RolesAndPermissionsSeeder
        // (a brand-new install) — nothing to revoke in that case, the seeder
        // creates Head Teacher with the trimmed set directly.
        $headTeacher = Role::where('name', 'Head Teacher')->where('guard_name', 'web')->first();
        if ($headTeacher) {
            $headTeacher->revokePermissionTo(self::MOVED_TO_MANAGER);
        }
    }

    public function down(): void
    {
        $headTeacher = Role::where('name', 'Head Teacher')->where('guard_name', 'web')->first();
        if ($headTeacher) {
            $headTeacher->givePermissionTo(self::MOVED_TO_MANAGER);
        }

        Role::where('name', 'Manager')->where('guard_name', 'web')->delete();
    }
};
