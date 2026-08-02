<?php

namespace App\Services\AI\Tools;

use App\Models\SchoolClass;
use App\Models\TimetableEntry;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;

/**
 * "Show this week's timetable." No new capability is gated here for a
 * user's own schedule — every staff member can already see their own
 * timetable in the app. Asking for a *different* class's schedule requires
 * classes.manage, same boundary as everywhere else.
 */
class TimetableTool
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function name(): string
    {
        return 'timetable.weekly';
    }

    /** @param  array<string, mixed>  $params */
    public function authorize(User $user, array $params): bool|string
    {
        if (filled($params['class_name'] ?? null) && ! $this->authorization->canViewSchoolWideTimetable($user)) {
            return 'You do not have permission to view another class\'s timetable.';
        }

        return true;
    }

    /** @param  array<string, mixed>  $params */
    public function run(User $user, array $params): array
    {
        $query = TimetableEntry::query()->with(['subject', 'schoolClass', 'teacher', 'room', 'period']);

        if (filled($params['class_name'] ?? null)) {
            $schoolClass = SchoolClass::where('name', 'like', $params['class_name'])->first();
            if (! $schoolClass) {
                return ['error' => "No class named \"{$params['class_name']}\" was found."];
            }
            $query->where('school_class_id', $schoolClass->id);
            $scope = $schoolClass->name;
        } else {
            $query->where('teacher_id', $user->id);
            $scope = 'own';
        }

        $entries = $query->get()
            ->sortBy(fn (TimetableEntry $entry) => [$entry->day_of_week, $entry->period?->start_time])
            ->map(fn (TimetableEntry $entry) => [
                'day_of_week' => $entry->day_of_week,
                'start_time' => $entry->period?->start_time,
                'end_time' => $entry->period?->end_time,
                'subject' => $entry->subject?->name,
                'class_name' => $entry->schoolClass?->name,
                'teacher' => $entry->teacher?->name,
                'room' => $entry->room?->name,
            ])
            ->values()
            ->all();

        return ['scope' => $scope, 'entries' => $entries];
    }
}
