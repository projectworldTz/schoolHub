<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\MarkAttendanceRequest;
use App\Services\School\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(protected AttendanceService $attendance) {}

    /**
     * The daily register for a class/stream: every actively-enrolled
     * student, with their attendance status for the date if already marked.
     */
    public function register(Request $request)
    {
        abort_unless($request->user()->can('attendance.manage'), 403);

        $data = $request->validate([
            'school_class_id' => ['required', 'uuid'],
            'stream_id' => ['nullable', 'uuid'],
            'academic_year_id' => ['required', 'uuid'],
            'date' => ['required', 'date'],
        ]);

        $rows = $this->attendance->register(
            $data['academic_year_id'],
            $data['school_class_id'],
            $data['stream_id'] ?? null,
            $data['date'],
        );

        return response()->json([
            'data' => array_map(fn ($row) => [
                'student_id' => $row['student']->id,
                'admission_number' => $row['student']->admission_number,
                'full_name' => $row['student']->full_name,
                'status' => $row['record']?->status,
                'remarks' => $row['record']?->remarks,
            ], $rows),
        ]);
    }

    public function store(MarkAttendanceRequest $request)
    {
        $data = $request->validated();

        $this->attendance->markBulk(
            array_map(fn ($record) => [
                'student_id' => $record['student_id'],
                'school_class_id' => $data['school_class_id'],
                'stream_id' => $data['stream_id'] ?? null,
                'academic_year_id' => $data['academic_year_id'],
                'date' => $data['date'],
                'status' => $record['status'],
                'remarks' => $record['remarks'] ?? null,
            ], $data['records']),
            $request->user()->id,
        );

        return response()->json(['message' => 'Attendance saved.']);
    }
}
