<?php

namespace App\Services\School;

use App\Models\TeacherAvailability;
use App\Models\TimetableEntry;
use App\Models\TimetablePeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TimetableGeneratorService
{
    public function generate(string $yearId, array $assignments, array $days, array $unavailable = []): array
    {
        $periods = TimetablePeriod::where('is_break', false)->orderBy('sort_order')->orderBy('start_time')->get()->all();
        if ($periods === []) {
            throw ValidationException::withMessages(['periods' => 'Create teaching periods before generating.']);
        }

        $savedUnavailable = TeacherAvailability::where('academic_year_id', $yearId)->where('is_available', false)
            ->get(['teacher_id', 'day_of_week', 'timetable_period_id'])->toArray();
        $blocked = collect([...$savedUnavailable, ...$unavailable])->mapWithKeys(fn ($s) => ["{$s['teacher_id']}|{$s['day_of_week']}|{$s['timetable_period_id']}" => true])->all();
        $occupied = [];
        TimetableEntry::where('academic_year_id', $yearId)->get()->each(function ($e) use (&$occupied) {
            foreach ($this->keys($e->school_class_id, $e->stream_id, $e->teacher_id, $e->room_id, $e->day_of_week, $e->timetable_period_id) as $key) {
                $occupied[$key] = true;
            }
        });

        $tasks = [];
        foreach ($assignments as $a) {
            $doubles = $a['double_periods'] ?? 0;
            for ($i = 0; $i < $doubles; $i++) {
                $tasks[] = [$a, 2];
            }
            for ($i = $doubles * 2; $i < $a['periods_per_week']; $i++) {
                $tasks[] = [$a, 1];
            }
        }
        usort($tasks, fn ($a, $b) => $b[1] <=> $a[1]);

        $placed = [];
        if (! $this->place(0, $tasks, $days, $periods, $blocked, $occupied, $placed)) {
            throw ValidationException::withMessages(['assignments' => 'Requirements cannot fit without a class, teacher, room, or availability conflict.']);
        }

        return DB::transaction(fn () => collect($placed)->map(fn ($e) => TimetableEntry::create([...$e, 'academic_year_id' => $yearId]))->all());
    }

    private function place(int $i, array $tasks, array $days, array $periods, array $blocked, array &$occupied, array &$placed): bool
    {
        if ($i === count($tasks)) {
            return true;
        }
        [$a, $length] = $tasks[$i];
        foreach ($days as $day) {
            for ($start = 0; $start <= count($periods) - $length; $start++) {
                $chosen = array_slice($periods, $start, $length);
                if ($length === 2 && substr($chosen[0]->end_time, 0, 5) !== substr($chosen[1]->start_time, 0, 5)) {
                    continue;
                }
                $reservation = [];
                foreach ($chosen as $p) {
                    if (isset($blocked["{$a['teacher_id']}|{$day}|{$p->id}"])) {
                        continue 2;
                    }
                    foreach ($this->keys($a['school_class_id'], $a['stream_id'] ?? null, $a['teacher_id'], $a['room_id'] ?? null, $day, $p->id) as $key) {
                        if (isset($occupied[$key])) {
                            continue 3;
                        }
                        $reservation[] = $key;
                    }
                }
                foreach ($reservation as $key) {
                    $occupied[$key] = true;
                }
                foreach ($chosen as $p) {
                    $placed[] = [...$a, 'timetable_period_id' => $p->id, 'day_of_week' => $day];
                }
                if ($this->place($i + 1, $tasks, $days, $periods, $blocked, $occupied, $placed)) {
                    return true;
                }
                foreach ($chosen as $_) {
                    array_pop($placed);
                }
                foreach ($reservation as $key) {
                    unset($occupied[$key]);
                }
            }
        }

        return false;
    }

    private function keys(string $class, ?string $stream, string $teacher, ?string $room, string $day, string $period): array
    {
        $keys = ["class:{$class}:{$stream}|{$day}|{$period}", "teacher:{$teacher}|{$day}|{$period}"];
        if ($room) {
            $keys[] = "room:{$room}|{$day}|{$period}";
        }

        return $keys;
    }
}
