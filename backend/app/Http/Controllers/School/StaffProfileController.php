<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\StaffProfileRequest;
use App\Http\Requests\School\SyncTeacherClassesRequest;
use App\Http\Requests\School\SyncTeacherSubjectsRequest;
use App\Http\Resources\School\StaffProfileResource;
use App\Models\StaffProfile;
use Illuminate\Http\Request;

class StaffProfileController extends Controller
{
    /**
     * Ordered by the related user's name and joined (not whereHas) so that
     * ordering is possible at all — `name` lives on `users`, not
     * `staff_profiles`. Without an explicit order, a school with more staff
     * than fits on one page got an arbitrary, potentially unstable slice
     * from paginate(), which looked like "some staff just don't show up".
     */
    public function index(Request $request)
    {
        $staff = StaffProfile::query()
            ->select('staff_profiles.*')
            ->join('users', 'users.id', '=', 'staff_profiles.user_id')
            ->with(['user.roles', 'user.subjectsTaught', 'user.assignedClasses', 'department', 'branch'])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where('users.name', 'like', "%{$search}%");
            })
            ->when($request->input('branch_id'), fn ($q, $id) => $q->where('staff_profiles.branch_id', $id))
            ->orderBy('users.name')
            ->paginate($request->integer('per_page', 100));

        return StaffProfileResource::collection($staff);
    }

    public function store(StaffProfileRequest $request)
    {
        $staff = StaffProfile::create($request->validated());

        return new StaffProfileResource($staff->load(['user.roles', 'department', 'branch']));
    }

    public function show(StaffProfile $staff)
    {
        return new StaffProfileResource(
            $staff->load(['user.roles', 'user.subjectsTaught', 'user.assignedClasses', 'department', 'branch'])
        );
    }

    public function update(StaffProfileRequest $request, StaffProfile $staff)
    {
        $staff->update($request->validated());

        return new StaffProfileResource($staff->load(['user.roles', 'department', 'branch']));
    }

    public function destroy(Request $request, StaffProfile $staff)
    {
        abort_unless($request->user()->can('staff.manage'), 403);

        $staff->delete();

        return response()->noContent();
    }

    public function syncSubjects(SyncTeacherSubjectsRequest $request, StaffProfile $staff)
    {
        $staff->user->subjectsTaught()->sync($request->validated('subject_ids'));

        return new StaffProfileResource($staff->load(['user.subjectsTaught', 'department']));
    }

    public function syncClasses(SyncTeacherClassesRequest $request, StaffProfile $staff)
    {
        $staff->user->assignedClasses()->sync($request->validated('class_ids'));

        return new StaffProfileResource($staff->load(['user.assignedClasses', 'department']));
    }
}
