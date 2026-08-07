<?php

namespace App\Services\School;

use App\Models\AttendanceRecord;
use App\Models\StudentEnrollment;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    /**
     * Roster for a class (optionally a stream) on a given date: every
     * actively-enrolled student, merged with their attendance record for
     * that date if one already exists (null if not yet marked).
     */
    public function register(string $academicYearId, string $schoolClassId, ?string $streamId, string $date): array
    {
        $enrollments = StudentEnrollment::query()
            ->with('student')
            ->where('academic_year_id', $academicYearId)
            ->where('school_class_id', $schoolClassId)
            ->when($streamId, fn ($q) => $q->where('stream_id', $streamId))
            ->where('status', 'active')
            ->get();

        $records = AttendanceRecord::query()
            ->where('school_class_id', $schoolClassId)
            ->where('date', $date)
            ->whereIn('student_id', $enrollments->pluck('student_id'))
            ->get()
            ->keyBy('student_id');

        return $enrollments
            ->sortBy(fn ($enrollment) => $enrollment->student->last_name)
            ->map(fn ($enrollment) => [
                'student' => $enrollment->student,
                'record' => $records->get($enrollment->student_id),
            ])
            ->values()
            ->all();
    }

    public function mark(array $attributes, string $markedBy): AttendanceRecord
    {
        return AttendanceRecord::updateOrCreate(
            ['student_id' => $attributes['student_id'], 'date' => $attributes['date']],
            [
                'school_class_id' => $attributes['school_class_id'],
                'stream_id' => $attributes['stream_id'] ?? null,
                'academic_year_id' => $attributes['academic_year_id'],
                'status' => $attributes['status'],
                'remarks' => $attributes['remarks'] ?? null,
                'marked_by' => $markedBy,
                'confirmed_at' => now(),
                'confirmed_by' => $markedBy,
            ]
        );
    }

    public function markBulk(array $records, string $markedBy): void
    {
        DB::transaction(function () use ($records, $markedBy) {
            foreach ($records as $record) {
                $this->mark($record, $markedBy);
            }
        });
    }

    /**
     * A class+date is locked the moment it's first saved — saving IS the
     * confirmation step (see AttendanceController::store()'s guard), there's
     * no separate draft state. Returns the confirming record (for its
     * confirmed_at/confirmed_by) so the register endpoint can tell the
     * frontend who locked it and when, or null if this class+date is still
     * open for marking.
     */
    public function confirmedRecord(string $schoolClassId, string $date): ?AttendanceRecord
    {
        return AttendanceRecord::where('school_class_id', $schoolClassId)
            ->where('date', $date)
            ->whereNotNull('confirmed_at')
            ->with('confirmedBy')
            ->first();
    }

    /**
     * One point per calendar month (oldest first) — the "line graph" trend
     * behind a single student's attendance history: how many days were
     * present/absent/late/excused that month, and the resulting rate
     * (present ÷ marked days, as a percentage). Fed straight into a line
     * chart on the student detail page (staff) and the parent portal.
     *
     * @param  Collection<int, AttendanceRecord>  $records
     * @return array<int, array{period: string, present: int, absent: int, late: int, excused: int, total: int, rate: float}>
     */
    public function trend(Collection $records): array
    {
        return $records
            ->groupBy(fn (AttendanceRecord $record) => $record->date->format('Y-m'))
            ->map(function (Collection $group, string $period) {
                $total = $group->count();
                $present = $group->where('status', 'present')->count();

                return [
                    'period' => $period,
                    'present' => $present,
                    'absent' => $group->where('status', 'absent')->count(),
                    'late' => $group->where('status', 'late')->count(),
                    'excused' => $group->where('status', 'excused')->count(),
                    'total' => $total,
                    'rate' => $total > 0 ? round(($present / $total) * 100, 1) : 0.0,
                ];
            })
            ->sortKeys()
            ->values()
            ->all();
    }
}
