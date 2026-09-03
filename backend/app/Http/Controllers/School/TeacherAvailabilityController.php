<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\TeacherAvailability;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeacherAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);

        return response()->json(['data' => TeacherAvailability::query()
            ->when($request->teacher_id, fn ($q, $id) => $q->where('teacher_id', $id))
            ->when($request->academic_year_id, fn ($q, $id) => $q->where('academic_year_id', $id))->get()]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);
        $exists = fn ($table) => Rule::exists($table, 'id')->where('school_id', Tenant::id());
        $data = $request->validate([
            'teacher_id' => ['required', 'uuid', $exists('users')],
            'academic_year_id' => ['required', 'uuid', $exists('academic_years')],
            'unavailable_slots' => ['present', 'array', 'max:100'],
            'unavailable_slots.*.day_of_week' => ['required', Rule::in(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])],
            'unavailable_slots.*.timetable_period_id' => ['required', 'uuid', $exists('timetable_periods')],
        ]);
        DB::transaction(function () use ($data) {
            TeacherAvailability::where('teacher_id', $data['teacher_id'])->where('academic_year_id', $data['academic_year_id'])->delete();
            foreach ($data['unavailable_slots'] as $slot) {
                TeacherAvailability::create([...$slot, 'teacher_id' => $data['teacher_id'], 'academic_year_id' => $data['academic_year_id'], 'is_available' => false]);
            }
        });

        return response()->json(['message' => 'Teacher availability updated.']);
    }
}
