<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\TimetableEntry;
use App\Models\TimetableSubstitution;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TimetableSubstitutionController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);

        return response()->json(['data' => TimetableSubstitution::with(['timetableEntry.subject', 'timetableEntry.period', 'substituteTeacher'])->orderByDesc('date')->get()]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);
        $exists = fn ($table) => Rule::exists($table, 'id')->where('school_id', Tenant::id());
        $data = $request->validate([
            'timetable_entry_id' => ['required', 'uuid', $exists('timetable_entries')],
            'substitute_teacher_id' => ['required', 'uuid', $exists('users')],
            'date' => ['required', 'date'], 'reason' => ['nullable', 'string', 'max:255'],
        ]);
        $entry = TimetableEntry::findOrFail($data['timetable_entry_id']);
        if (Carbon::parse($data['date'])->format('l') !== ucfirst($entry->day_of_week)) {
            throw ValidationException::withMessages(['date' => 'The selected date does not match the lesson weekday.']);
        }
        $conflict = $entry->teacher_id === $data['substitute_teacher_id'] || TimetableEntry::where('teacher_id', $data['substitute_teacher_id'])
            ->where('academic_year_id', $entry->academic_year_id)->where('day_of_week', $entry->day_of_week)
            ->where('timetable_period_id', $entry->timetable_period_id)->exists();
        $conflict = $conflict || TimetableSubstitution::where('date', $data['date'])
            ->where('substitute_teacher_id', $data['substitute_teacher_id'])
            ->whereHas('timetableEntry', fn ($q) => $q->where('timetable_period_id', $entry->timetable_period_id))
            ->exists();
        if ($conflict) {
            throw ValidationException::withMessages(['substitute_teacher_id' => 'This teacher already has a lesson in that period.']);
        }

        $substitution = TimetableSubstitution::updateOrCreate(
            ['timetable_entry_id' => $entry->id, 'date' => $data['date']],
            [...$data, 'created_by' => $request->user()->id]
        );

        return response()->json(['data' => $substitution->load(['timetableEntry.subject', 'timetableEntry.period', 'substituteTeacher'])], 201);
    }

    public function destroy(Request $request, TimetableSubstitution $substitution)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);
        $substitution->delete();

        return response()->noContent();
    }
}
