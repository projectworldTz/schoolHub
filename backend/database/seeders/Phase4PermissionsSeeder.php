<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 4 (Examination System, LMS).
 * Parent Portal needs no new permission string — access is gated by the
 * 'Parent' role itself (see routes/api.php's `role:Parent` group) plus an
 * ownership check per request (a guardian can only ever see their own
 * linked children), not a school-wide manage permission. Granting a
 * guardian portal access is folded into the existing 'students.manage'
 * permission rather than a new one, since it's part of managing that
 * student's guardians.
 *
 * 'exams.manage' vs 'exam-marks.record': originally a single permission
 * covered both "administer the exam" (create exams, add class/subject
 * combinations, set pass/max marks — the academic-oversight layer) and
 * "record a student's marks" (the day-to-day gradebook-entry layer a
 * subject teacher does). Split so a plain Teacher can only do the latter —
 * they shouldn't be able to change a subject's pass mark or print/generate
 * report cards, only enter the marks they were asked to grade. Class
 * Teacher keeps full 'exams.manage' (unchanged from before this split)
 * since printing report cards for their own homeroom class is a normal
 * part of that role. The grading *bands* themselves ("A is 80-100") are a
 * separate permission again — 'subjects.manage', from Phase 1 — since
 * that's a school-wide policy decision, not a per-exam one.
 */
class Phase4PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'exams.manage',
        'exam-marks.record',
        'lms.manage',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['exams.manage', 'exam-marks.record', 'lms.manage'],
        'Principal' => ['exams.manage', 'exam-marks.record', 'lms.manage'],
        'Vice Principal' => ['exams.manage', 'exam-marks.record', 'lms.manage'],
        'Academic Master' => ['exams.manage', 'exam-marks.record', 'lms.manage'],
        'Class Teacher' => ['exams.manage', 'exam-marks.record', 'lms.manage'],
        'Teacher' => ['exam-marks.record', 'lms.manage'],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            Role::findByName($role, 'web')->givePermissionTo($permissions);
        }

        // givePermissionTo is additive and can't narrow a role back down —
        // needed here because this seeder used to grant Teacher the broad
        // 'exams.manage' before the split above, and re-running the seeder
        // on an already-seeded database wouldn't otherwise revoke it.
        Role::findByName('Teacher', 'web')->revokePermissionTo('exams.manage');
    }
}
