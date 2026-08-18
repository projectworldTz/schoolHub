<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\SchoolClassRequest;
use App\Http\Requests\School\SyncClassSubjectsRequest;
use App\Http\Resources\School\SchoolClassResource;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    /**
     * Read access is open to any authenticated school user, same as other
     * reference-data GETs (see Phase1PermissionsSeeder) — a Bursar building
     * invoices, a subject teacher marking attendance, or anyone building a
     * timetable all need to see every class, not just ones they're a
     * class_teacher/homeroom teacher for. That narrower per-user scoping
     * (User::canAccessClass()) is enforced independently on the actual
     * write paths that need it (e.g. AnnouncementRequest, ExamSubjectRequest),
     * not here.
     */
    public function index(Request $request)
    {
        return SchoolClassResource::collection(
            SchoolClass::query()
                ->with(['subjects', 'branch', 'assignedTeachers.roles'])
                ->when($request->input('branch_id'), fn ($q, $id) => $q->where('branch_id', $id))
                ->orderBy('level')
                ->get()
        );
    }

    public function store(SchoolClassRequest $request)
    {
        return new SchoolClassResource(SchoolClass::create($request->validated()));
    }

    public function show(SchoolClass $class)
    {
        return new SchoolClassResource($class->load(['subjects', 'streams', 'branch', 'assignedTeachers.roles']));
    }

    public function update(SchoolClassRequest $request, SchoolClass $class)
    {
        $class->update($request->validated());

        return new SchoolClassResource($class);
    }

    public function destroy(Request $request, SchoolClass $class)
    {
        abort_unless($request->user()->can('classes.manage'), 403);

        $class->delete();

        return response()->noContent();
    }

    public function syncSubjects(SyncClassSubjectsRequest $request, SchoolClass $class)
    {
        $class->subjects()->sync($request->validated('subject_ids'));

        return new SchoolClassResource($class->load('subjects'));
    }
}
