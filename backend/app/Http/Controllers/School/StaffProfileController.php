<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\StaffProfileRequest;
use App\Http\Requests\School\SyncTeacherSubjectsRequest;
use App\Http\Resources\School\StaffProfileResource;
use App\Models\StaffProfile;
use Illuminate\Http\Request;

class StaffProfileController extends Controller
{
    public function index(Request $request)
    {
        $staff = StaffProfile::query()
            ->with(['user.roles', 'user.subjectsTaught', 'department', 'branch'])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search');
                $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            })
            ->when($request->input('branch_id'), fn ($q, $id) => $q->where('branch_id', $id))
            ->paginate($request->integer('per_page', 20));

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
            $staff->load(['user.roles', 'user.subjectsTaught', 'department', 'branch'])
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
}
