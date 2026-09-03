<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\TimetableEntryRequest;
use App\Http\Resources\School\TimetableEntryResource;
use App\Models\TimetableEntry;
use App\Services\School\TimetableGeneratorService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TimetableEntryController extends Controller
{
    protected const WITH = ['schoolClass', 'stream', 'subject', 'teacher', 'room', 'period'];

    public function index(Request $request)
    {
        $entries = TimetableEntry::query()
            ->with(self::WITH)
            ->when($request->input('school_class_id'), fn ($q, $id) => $q->where('school_class_id', $id))
            ->when($request->input('stream_id'), fn ($q, $id) => $q->where('stream_id', $id))
            ->when($request->input('teacher_id'), fn ($q, $id) => $q->where('teacher_id', $id))
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->where('academic_year_id', $id))
            ->get();

        return TimetableEntryResource::collection($entries);
    }

    public function store(TimetableEntryRequest $request)
    {
        $entry = TimetableEntry::create($request->validated());

        return new TimetableEntryResource($entry->load(self::WITH));
    }

    public function update(TimetableEntryRequest $request, TimetableEntry $timetable_entry)
    {
        $timetable_entry->update($request->validated());

        return new TimetableEntryResource($timetable_entry->load(self::WITH));
    }

    public function destroy(Request $request, TimetableEntry $timetable_entry)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);

        $timetable_entry->delete();

        return response()->noContent();
    }

    public function generate(Request $request, TimetableGeneratorService $generator)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);
        $exists = fn (string $table) => Rule::exists($table, 'id')->where('school_id', Tenant::id());
        $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $data = $request->validate([
            'academic_year_id' => ['required', 'uuid', $exists('academic_years')],
            'days' => ['sometimes', 'array', 'min:1'], 'days.*' => [Rule::in($validDays)],
            'assignments' => ['required', 'array', 'min:1', 'max:100'],
            'assignments.*.school_class_id' => ['required', 'uuid', $exists('school_classes')],
            'assignments.*.stream_id' => ['nullable', 'uuid', $exists('streams')],
            'assignments.*.subject_id' => ['required', 'uuid', $exists('subjects')],
            'assignments.*.teacher_id' => ['required', 'uuid', $exists('users')],
            'assignments.*.room_id' => ['nullable', 'uuid', $exists('rooms')],
            'assignments.*.periods_per_week' => ['required', 'integer', 'min:1', 'max:20'],
            'assignments.*.double_periods' => ['sometimes', 'integer', 'min:0', 'max:10'],
            'unavailable' => ['sometimes', 'array', 'max:500'],
            'unavailable.*.teacher_id' => ['required', 'uuid', $exists('users')],
            'unavailable.*.day_of_week' => ['required', Rule::in($validDays)],
            'unavailable.*.timetable_period_id' => ['required', 'uuid', $exists('timetable_periods')],
        ]);
        foreach ($data['assignments'] as $i => $a) {
            if (($a['double_periods'] ?? 0) * 2 > $a['periods_per_week']) {
                throw ValidationException::withMessages(["assignments.{$i}.double_periods" => 'Double periods exceed total weekly periods.']);
            }
        }
        $entries = $generator->generate($data['academic_year_id'], $data['assignments'], $data['days'] ?? array_slice($validDays, 0, 5), $data['unavailable'] ?? []);

        return TimetableEntryResource::collection(collect($entries)->each->load(self::WITH));
    }
}
