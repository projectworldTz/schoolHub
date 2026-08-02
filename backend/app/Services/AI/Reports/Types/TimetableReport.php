<?php

namespace App\Services\AI\Reports\Types;

use App\Models\SchoolClass;
use App\Models\TimetableEntry;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;

/**
 * Same scoping as App\Services\AI\Tools\TimetableTool — a user's own
 * schedule needs no extra permission; another class's timetable needs
 * classes.manage.
 */
class TimetableReport
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function type(): string
    {
        return 'timetable';
    }

    /** @param  array<string, mixed>  $params */
    public function authorize(User $user, array $params): bool|string
    {
        if (filled($params['class_name'] ?? null) && ! $this->authorization->canViewSchoolWideTimetable($user)) {
            return 'You do not have permission to export another class\'s timetable.';
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{title: string, rows: array<int, array<string, mixed>>, truncated: bool}
     */
    public function data(User $user, array $params): array
    {
        $query = TimetableEntry::query()->with(['subject', 'schoolClass', 'teacher', 'room', 'period']);

        if (filled($params['class_name'] ?? null)) {
            $schoolClass = SchoolClass::where('name', 'like', $params['class_name'])->first();
            if (! $schoolClass) {
                return ['title' => 'Weekly Timetable', 'rows' => [], 'truncated' => false];
            }
            $query->where('school_class_id', $schoolClass->id);
            $title = "Weekly Timetable — {$schoolClass->name}";
        } else {
            $query->where('teacher_id', $user->id);
            $title = "Weekly Timetable — {$user->name}";
        }

        $entries = $query->get()
            ->sortBy(fn (TimetableEntry $entry) => [$entry->day_of_week, $entry->period?->start_time])
            ->map(fn (TimetableEntry $entry) => [
                'day_of_week' => ucfirst($entry->day_of_week),
                'start_time' => $entry->period?->start_time,
                'end_time' => $entry->period?->end_time,
                'subject' => $entry->subject?->name,
                'class_name' => $entry->schoolClass?->name,
                'teacher' => $entry->teacher?->name,
                'room' => $entry->room?->name,
            ])
            ->values()
            ->all();

        return ['title' => $title, 'rows' => $entries, 'truncated' => false];
    }
}
