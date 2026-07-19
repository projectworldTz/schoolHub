<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\MarkStaffAttendanceRequest;
use App\Services\School\StaffAttendanceService;
use Illuminate\Http\Request;

class StaffAttendanceController extends Controller
{
    public function __construct(protected StaffAttendanceService $attendance) {}

    public function register(Request $request)
    {
        abort_unless($request->user()->can('staff.manage'), 403);

        $data = $request->validate([
            'date' => ['required', 'date'],
        ]);

        $rows = $this->attendance->register($data['date']);

        return response()->json([
            'data' => array_map(fn ($row) => [
                'user_id' => $row['user']->id,
                'name' => $row['user']->name,
                'job_title' => $row['user']->staffProfile?->job_title,
                'status' => $row['record']?->status,
                'remarks' => $row['record']?->remarks,
            ], $rows),
        ]);
    }

    public function store(MarkStaffAttendanceRequest $request)
    {
        $data = $request->validated();

        $this->attendance->markBulk(
            array_map(fn ($record) => [
                'user_id' => $record['user_id'],
                'date' => $data['date'],
                'status' => $record['status'],
                'remarks' => $record['remarks'] ?? null,
            ], $data['records']),
            $request->user()->id,
        );

        return response()->json(['message' => 'Staff attendance saved.']);
    }
}
