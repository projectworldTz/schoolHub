<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 7 (Analytics dashboards, and
 * later additions to the same phase: Discipline, Graduation). Document
 * generation reuses each document's own domain permission (students.manage
 * for certificates, exams.manage for transcripts, staff.manage for contract
 * letters) rather than a new permission, since a generated document is just
 * another view of data already gated by those permissions — the same
 * reasoning ReportCardController applies. Direct messaging (conversations/
 * messages) deliberately has NO gating permission of its own — any
 * authenticated staff member can message any other, the same "no special
 * permission beyond being logged in" reasoning leave-request self-service
 * creation already uses. 'audit-log.view' is deliberately restricted to
 * the top admin tier only (not Academic Master/Accountant/Bursar, who get
 * plain 'analytics.view') — the log spans both finance and grades, and who
 * changed what is the kind of thing a school's owner/principal should see
 * across every domain, not something to fragment by department.
 */
class Phase7PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'analytics.view',
        'discipline.manage',
        'graduation.manage',
        'audit-log.view',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['analytics.view', 'discipline.manage', 'graduation.manage', 'audit-log.view'],
        'Principal' => ['analytics.view', 'discipline.manage', 'graduation.manage', 'audit-log.view'],
        'Vice Principal' => ['analytics.view', 'discipline.manage', 'graduation.manage', 'audit-log.view'],
        'Academic Master' => ['analytics.view'],
        'Accountant' => ['analytics.view'],
        'Bursar' => ['analytics.view'],
        'Registrar' => ['graduation.manage'],
        'Class Teacher' => ['discipline.manage'],
        'Teacher' => ['discipline.manage'],
        'Security Officer' => ['discipline.manage'],
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
