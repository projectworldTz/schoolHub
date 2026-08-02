<?php

namespace App\Services\AI\Tools;

use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;
use Illuminate\Support\Carbon;

/**
 * "How many students were absent today" and similar. A Teacher is scoped to
 * their own assigned classes (User::canAccessClass()'s own definition of
 * "assigned"); classes.manage holders see the whole school, grouped by
 * class. The date always defaults to "today" in the school's own timezone,
 * not the server's.
 */
class AttendanceTool
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function name(): string
    {
        return 'attendance.absent_today';
    }

    public function authorize(User $user): bool|string
    {
        if (! $this->authorization->canUseAttendanceTool($user)) {
            return 'You do not have permission to view attendance records.';
        }

        return true;
    }

    /** @param  array<string, mixed>  $params */
    public function run(User $user, array $params, string $schoolTimezone): array
    {
        $date = $this->resolveDate($params['date'] ?? null, $schoolTimezone);

        $query = AttendanceRecord::query()
            // whereDate(), not where() — the 'date' cast can persist with a
            // 00:00:00 time component depending on the DB driver (SQLite in
            // particular), which an exact string match against a plain
            // Y-m-d value would silently fail to find.
            ->whereDate('date', $date)
            ->where('status', 'absent');

        if ($this->authorization->canViewSchoolWideAttendance($user)) {
            if (filled($params['class_name'] ?? null)) {
                $schoolClass = SchoolClass::where('name', 'like', $params['class_name'])->first();
                if (! $schoolClass) {
                    return ['date' => $date, 'error' => "No class named \"{$params['class_name']}\" was found."];
                }
                $query->where('school_class_id', $schoolClass->id);
            }
        } else {
            $classIds = $user->assignedClassIds();
            if ($classIds->isEmpty()) {
                return ['date' => $date, 'total_absent' => 0, 'note' => 'This user has no assigned classes.'];
            }
            $query->whereIn('school_class_id', $classIds);
        }

        $total = (clone $query)->count();

        $byClass = (clone $query)
            ->join('school_classes', 'school_classes.id', '=', 'attendance_records.school_class_id')
            ->selectRaw('school_classes.name as class_name, count(*) as absent_count')
            ->groupBy('school_classes.name')
            ->orderByDesc('absent_count')
            ->get()
            ->map(fn ($row) => ['class_name' => $row->class_name, 'absent_count' => (int) $row->absent_count])
            ->all();

        return [
            'date' => $date,
            'total_absent' => $total,
            'by_class' => $byClass,
        ];
    }

    protected function resolveDate(?string $requested, string $schoolTimezone): string
    {
        if (blank($requested)) {
            return Carbon::now($schoolTimezone)->toDateString();
        }

        try {
            return Carbon::parse($requested, $schoolTimezone)->toDateString();
        } catch (\Throwable) {
            return Carbon::now($schoolTimezone)->toDateString();
        }
    }
}
