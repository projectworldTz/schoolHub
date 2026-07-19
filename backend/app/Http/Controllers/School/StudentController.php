<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\StudentRequest;
use App\Http\Resources\School\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $students = Student::query()
            ->with(['currentEnrollment.academicYear', 'currentEnrollment.schoolClass.branch', 'currentEnrollment.stream'])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('admission_number', 'like', "%{$search}%");
                });
            })
            ->when($request->input('branch_id'), fn ($q, $id) => $q->whereHas(
                'currentEnrollment.schoolClass',
                fn ($q) => $q->where('branch_id', $id)
            ))
            ->orderBy('last_name')
            ->paginate($request->integer('per_page', 20));

        return StudentResource::collection($students);
    }

    public function store(StudentRequest $request)
    {
        $student = Student::create($request->validated());

        return new StudentResource($student);
    }

    public function show(Student $student)
    {
        return new StudentResource(
            $student->load(['guardians', 'currentEnrollment.academicYear', 'currentEnrollment.schoolClass.branch', 'currentEnrollment.stream', 'documents'])
        );
    }

    public function update(StudentRequest $request, Student $student)
    {
        $student->update($request->validated());

        return new StudentResource($student);
    }

    public function destroy(Request $request, Student $student)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        $student->delete();

        return response()->noContent();
    }
}
