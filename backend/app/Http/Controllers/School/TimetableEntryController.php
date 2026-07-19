<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\TimetableEntryRequest;
use App\Http\Resources\School\TimetableEntryResource;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;

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
}
