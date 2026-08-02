<?php

namespace App\Services\AI;

use App\Models\User;

/**
 * One place every AI tool checks permissions through, reusing the exact
 * same permissions the rest of the app already gates the same data with —
 * deliberately no new "ai.*" permissions, since attendance.manage/
 * finance.manage/exams.manage/classes.manage already express precisely the
 * access boundaries these tools need:
 *   - attendance.manage is already broadly held by teaching roles (they
 *     mark attendance for their own classes), so it gates "can use the
 *     attendance tool at all"; classes.manage (the same signal
 *     User::canAccessClass() already uses everywhere else) gates
 *     school-wide vs assigned-classes-only.
 *   - finance.manage is already restricted to School Owner/Principal/
 *     Accountant/Bursar/Head Teacher tier — a plain Teacher doesn't have
 *     it, matching "teachers must not see school-wide financial
 *     information" directly.
 *   - exams.manage is already restricted similarly (a plain Teacher has
 *     exam-marks.record but not exams.manage); classes.manage again
 *     distinguishes school-wide from assigned-classes-only for the
 *     narrower "Class Teacher has exams.manage but not classes.manage"
 *     case.
 */
class AiAuthorizationService
{
    public function canUseAttendanceTool(User $user): bool
    {
        return $user->can('attendance.manage');
    }

    public function canViewSchoolWideAttendance(User $user): bool
    {
        return $user->can('classes.manage');
    }

    public function canUseFeesTool(User $user): bool
    {
        return $user->can('finance.manage');
    }

    public function canUseExamPerformanceTool(User $user): bool
    {
        return $user->can('exams.manage') || $user->assignedClassIds()->isNotEmpty();
    }

    public function canViewSchoolWideExamPerformance(User $user): bool
    {
        return $user->can('exams.manage') || $user->can('classes.manage');
    }

    public function canViewSchoolWideTimetable(User $user): bool
    {
        return $user->can('classes.manage');
    }
}
