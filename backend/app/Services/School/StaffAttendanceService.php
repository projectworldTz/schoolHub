<?php

namespace App\Services\School;

use App\Models\StaffAttendanceRecord;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StaffAttendanceService
{
    /**
     * Roster for a date: every active staff member, merged with their
     * attendance record for that date if one already exists (null if not
     * yet marked) — same shape as AttendanceService::register() for
     * students, just with no class/stream scoping.
     */
    public function register(string $date): array
    {
        $staff = User::query()
            ->whereHas('staffProfile')
            ->where('is_active', true)
            ->with('staffProfile')
            ->get();

        $records = StaffAttendanceRecord::query()
            ->where('date', $date)
            ->whereIn('user_id', $staff->pluck('id'))
            ->get()
            ->keyBy('user_id');

        return $staff
            ->sortBy('name')
            ->map(fn ($user) => [
                'user' => $user,
                'record' => $records->get($user->id),
            ])
            ->values()
            ->all();
    }

    public function mark(array $attributes, string $markedBy): StaffAttendanceRecord
    {
        return StaffAttendanceRecord::updateOrCreate(
            ['user_id' => $attributes['user_id'], 'date' => $attributes['date']],
            [
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
