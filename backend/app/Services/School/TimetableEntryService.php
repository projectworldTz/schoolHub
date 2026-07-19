<?php

namespace App\Services\School;

use App\Models\TimetableEntry;

/**
 * Conflict checks the schema can't fully express: the DB unique index on
 * (class, stream, day, period, year) treats every NULL stream_id as
 * distinct, so it misses double-booking a streamless class. This also
 * covers teacher/room conflicts, which aren't a DB constraint at all.
 */
class TimetableEntryService
{
    public function findClassConflict(array $attrs, ?string $ignoreId = null): ?TimetableEntry
    {
        return TimetableEntry::query()
            ->where('school_class_id', $attrs['school_class_id'])
            ->where('day_of_week', $attrs['day_of_week'])
            ->where('timetable_period_id', $attrs['timetable_period_id'])
            ->where('academic_year_id', $attrs['academic_year_id'])
            ->when(
                $attrs['stream_id'] ?? null,
                fn ($q, $streamId) => $q->where('stream_id', $streamId),
                fn ($q) => $q->whereNull('stream_id'),
            )
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->first();
    }

    public function findTeacherConflict(array $attrs, ?string $ignoreId = null): ?TimetableEntry
    {
        return TimetableEntry::query()
            ->where('teacher_id', $attrs['teacher_id'])
            ->where('day_of_week', $attrs['day_of_week'])
            ->where('timetable_period_id', $attrs['timetable_period_id'])
            ->where('academic_year_id', $attrs['academic_year_id'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->first();
    }

    public function findRoomConflict(array $attrs, ?string $ignoreId = null): ?TimetableEntry
    {
        if (empty($attrs['room_id'])) {
            return null;
        }

        return TimetableEntry::query()
            ->where('room_id', $attrs['room_id'])
            ->where('day_of_week', $attrs['day_of_week'])
            ->where('timetable_period_id', $attrs['timetable_period_id'])
            ->where('academic_year_id', $attrs['academic_year_id'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->first();
    }
}
