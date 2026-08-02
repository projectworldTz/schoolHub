<?php

namespace App\Services\AI\Reports\Types;

use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use App\Models\School;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;
use Illuminate\Support\Carbon;

/**
 * Same scoping as App\Services\AI\Tools\AttendanceTool (teacher limited to
 * assigned classes, classes.manage sees the whole school) but returns the
 * actual absentee rows for a date or date range, not just a count.
 */
class AttendanceReport
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function type(): string
    {
        return 'attendance';
    }

    public function authorize(User $user): bool|string
    {
        if (! $this->authorization->canUseAttendanceTool($user)) {
            return 'You do not have permission to export attendance records.';
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{title: string, rows: array<int, array<string, mixed>>, truncated: bool}
     */
    public function data(User $user, array $params, School $school, string $schoolTimezone): array
    {
        $from = $this->resolveDate($params['date_from'] ?? $params['date'] ?? null, $schoolTimezone);
        $to = $this->resolveDate($params['date_to'] ?? $params['date'] ?? null, $schoolTimezone);

        $query = AttendanceRecord::query()
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to)
            ->where('status', 'absent')
            ->with(['student', 'schoolClass']);

        $title = $from === $to ? "Absent Students — {$from}" : "Absent Students — {$from} to {$to}";

        if ($this->authorization->canViewSchoolWideAttendance($user)) {
            if (filled($params['class_name'] ?? null)) {
                $schoolClass = SchoolClass::where('name', 'like', $params['class_name'])->first();
                if (! $schoolClass) {
                    return ['title' => $title, 'rows' => [], 'truncated' => false];
                }
                $query->where('school_class_id', $schoolClass->id);
                $title .= " — {$schoolClass->name}";
            }
        } else {
            $classIds = $user->assignedClassIds();
            if ($classIds->isEmpty()) {
                return ['title' => $title, 'rows' => [], 'truncated' => false];
            }
            $query->whereIn('school_class_id', $classIds);
        }

        $maxRows = config('ai-reports.max_rows');
        $records = $query->orderBy('date')->limit($maxRows + 1)->get();
        $truncated = $records->count() > $maxRows;
        $records = $records->take($maxRows);

        $rows = $records->map(fn (AttendanceRecord $record) => [
            'admission_number' => $record->student->admission_number,
            'student_name' => "{$record->student->first_name} {$record->student->last_name}",
            'class_name' => $record->schoolClass?->name,
            'date' => $record->date->toDateString(),
            'status' => $record->status,
            'remarks' => $record->remarks,
        ])->values()->all();

        return ['title' => $title, 'rows' => $rows, 'truncated' => $truncated];
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
