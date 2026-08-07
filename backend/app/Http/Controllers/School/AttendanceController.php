<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\MarkAttendanceRequest;
use App\Http\Resources\School\AttendanceRecordResource;
use App\Models\AttendanceRecord;
use App\Models\Student;
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

        $confirmed = $this->attendance->confirmedRecord($data['school_class_id'], $data['date']);

        return response()->json([
            'data' => array_map(fn ($row) => [
                'student_id' => $row['student']->id,
                'admission_number' => $row['student']->admission_number,
                'full_name' => $row['student']->full_name,
                'status' => $row['record']?->status,
                'remarks' => $row['record']?->remarks,
            ], $rows),
            'meta' => [
                'confirmed' => (bool) $confirmed,
                'confirmed_at' => $confirmed?->confirmed_at,
                'confirmed_by_name' => $confirmed?->confirmedBy?->name,
            ],
        ]);
    }

    /**
     * Saving IS confirming — there's no separate draft/confirm step on the
     * backend, so once a class+date has any confirmed record this rejects
     * the whole batch outright rather than silently overwriting it. See
     * AttendanceService::mark().
     */
    public function store(MarkAttendanceRequest $request)
    {
        $data = $request->validated();

        $alreadyConfirmed = $this->attendance->confirmedRecord($data['school_class_id'], $data['date']);

        abort_if($alreadyConfirmed, 409, 'Attendance for this class and date has already been confirmed and can no longer be changed.');

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

        return response()->json(['message' => 'Attendance confirmed.']);
    }

    /**
     * One student's full attendance history plus a month-by-month rate
     * trend — lets a class teacher or Academic Master trace a student's
     * pattern over time, not just today's register.
     */
    public function history(Request $request, Student $student)
    {
        abort_unless(
            $request->user()->can('attendance.manage') || $request->user()->can('students.manage'),
            403
        );

        $records = AttendanceRecord::where('student_id', $student->id)
            ->orderByDesc('date')
            ->limit(365)
            ->get();

        return AttendanceRecordResource::collection($records)
            ->additional(['meta' => ['trend' => $this->attendance->trend($records)]]);
    }
}
