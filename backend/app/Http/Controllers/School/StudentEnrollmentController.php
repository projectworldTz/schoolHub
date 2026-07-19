<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\EnrollStudentRequest;
use App\Http\Resources\School\StudentEnrollmentResource;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class StudentEnrollmentController extends Controller
{
    public function index(Student $student)
    {
        return StudentEnrollmentResource::collection(
            $student->enrollments()
                ->with(['academicYear', 'schoolClass', 'stream'])
                ->orderByDesc('enrolled_at')
                ->get()
        );
    }

    public function store(EnrollStudentRequest $request, Student $student)
    {
        $data = $request->validated();
        $data['status'] ??= 'active';

        $enrollment = DB::transaction(function () use ($data, $student) {
            // Only one active enrollment per academic year makes sense;
            // superseding an existing one (e.g. a mid-year stream change)
            // marks the old row transferred rather than leaving two "active" rows.
            $student->enrollments()
                ->where('academic_year_id', $data['academic_year_id'])
                ->where('status', 'active')
                ->update(['status' => 'transferred']);

            return $student->enrollments()->create($data);
        });

        return new StudentEnrollmentResource($enrollment->load(['academicYear', 'schoolClass', 'stream']));
    }
}
