<?php

namespace App\Services\School;

use App\Models\AttendanceRecord;
use App\Models\StudentEnrollment;
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
}
