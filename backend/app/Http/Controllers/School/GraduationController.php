<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\GraduationBatchRequest;
use App\Http\Resources\School\StudentStatusChangeResource;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentStatusChange;
use App\Models\Term;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GraduationController extends Controller
{
    /**
     * Active students in a class, for the batch-graduate picker. Defaults to
     * the current term's academic year — same fallback chain used by
     * AnalyticsController::budget() — when the caller doesn't pin one down.
     */
    public function eligible(Request $request)
    {
        abort_unless($request->user()->can('graduation.manage'), 403);

        $academicYearId = $request->input('academic_year_id')
            ?? Term::where('is_current', true)->value('academic_year_id')
            ?? \App\Models\AcademicYear::orderByDesc('start_date')->value('id');

        $enrollments = StudentEnrollment::query()
            ->with(['student', 'schoolClass', 'stream'])
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->when($request->input('school_class_id'), fn ($q, $id) => $q->where('school_class_id', $id))
            ->get();

        return response()->json([
            'data' => $enrollments->map(fn ($enrollment) => [
                'student_id' => $enrollment->student_id,
                'name' => $enrollment->student->full_name,
                'admission_number' => $enrollment->student->admission_number,
                'class_name' => $enrollment->schoolClass?->name,
                'stream_name' => $enrollment->stream?->name,
            ]),
        ]);
    }

    /**
     * Batch status change. Student::booted()'s updated() hook writes the
     * StudentStatusChange audit row automatically for every student touched
     * here — this method only needs to also flip the matching active
     * enrollment row so the "one active enrollment per student" invariant
     * holds, the same pattern hostel/transport allocations use for
     * supersede-on-change.
     */
    public function batch(GraduationBatchRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            $students = Student::whereIn('id', $data['student_ids'])->get();

            foreach ($students as $student) {
                $student->statusChangeReason = $data['reason'] ?? null;
                $student->statusChangeDate = $data['effective_date'];
                $student->update(['status' => $data['to_status']]);

                StudentEnrollment::where('student_id', $student->id)
                    ->where('status', 'active')
                    ->update(['status' => $data['to_status']]);
            }
        });

        return response()->json(['message' => 'Status updated for '.count($data['student_ids']).' student(s).']);
    }

    public function history(Request $request)
    {
        abort_unless($request->user()->can('graduation.manage'), 403);

        $changes = StudentStatusChange::query()
            ->with(['student', 'changedBy'])
            ->when($request->input('to_status'), fn ($q, $status) => $q->where('to_status', $status))
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->orderByDesc('effective_date')
            ->paginate($request->integer('per_page', 20));

        return StudentStatusChangeResource::collection($changes);
    }
}
