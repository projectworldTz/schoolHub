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
     * Ordered by name and left-joined (not whereHas) so that ordering is
     * possible at all — for a login-backed member `name` lives on `users`,
     * not `staff_profiles`. LEFT JOIN (not JOIN) matters here specifically
     * because a no-login staff member (user_id null) has no matching users
     * row at all — an inner join would silently drop them from the
     * directory entirely. Without an explicit order, a school with more
     * staff than fits on one page also got an arbitrary, potentially
     * unstable slice from paginate(), which looked like "some staff just
     * don't show up".
     */
    public function index(Request $request)
    {
        $staff = StaffProfile::query()
            ->select('staff_profiles.*')
            ->leftJoin('users', 'users.id', '=', 'staff_profiles.user_id')
            ->with(['user.roles', 'user.subjectsTaught', 'user.assignedClasses', 'department', 'branch'])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('users.name', 'like', "%{$search}%")
                        ->orWhere('staff_profiles.name', 'like', "%{$search}%");
                });
            })
            ->when($request->input('branch_id'), fn ($q, $id) => $q->where('staff_profiles.branch_id', $id))
            ->orderByRaw('COALESCE(users.name, staff_profiles.name)')
            ->paginate($request->integer('per_page', 100));

        return StaffProfileResource::collection($staff);
    }

    public function store(StaffProfileRequest $request)
    {
        $staff = StaffProfile::create($this->normalizeStaffData($request->validated()));

        return new StaffProfileResource($staff->load(['user.roles', 'department', 'branch']));
    }

    public function show(StaffProfile $staff)
    {
        return new StaffProfileResource(
            $staff->load(['user.roles', 'user.subjectsTaught', 'user.assignedClasses', 'department', 'branch'])
        );
    }

    /**
     * user_id went from `required` to `nullable` (to allow no-login
     * records), which means a plain $request->validated() would now
     * validate a wholly-absent user_id as null and include it — silently
     * unlinking an existing login-backed staff member on any partial update
     * that doesn't happen to mention user_id. Only touch fields the caller
     * actually sent.
     */
    public function update(StaffProfileRequest $request, StaffProfile $staff)
    {
        $data = $request->validated();
        foreach (['user_id', 'name', 'phone'] as $field) {
            if (! $request->has($field)) {
                unset($data[$field]);
            }
        }

        $staff->update($this->normalizeStaffData($data));

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
        abort_unless($staff->user, 422, 'This staff member has no login account, so subjects cannot be assigned.');

        $staff->user->subjectsTaught()->sync($request->validated('subject_ids'));

        return new StaffProfileResource($staff->load(['user.subjectsTaught', 'department']));
    }

    public function syncClasses(SyncTeacherClassesRequest $request, StaffProfile $staff)
    {
        abort_unless($staff->user, 422, 'This staff member has no login account, so classes cannot be assigned.');

        $staff->user->assignedClasses()->sync($request->validated('class_ids'));

        return new StaffProfileResource($staff->load(['user.assignedClasses', 'department']));
    }

    /**
     * name/phone only make sense for a no-login record — once a user_id is
     * set, the real values live on that User, so clear the local columns
     * rather than let stale duplicates sit in both places.
     */
    protected function normalizeStaffData(array $data): array
    {
        if (! empty($data['user_id'])) {
            $data['name'] = null;
            $data['phone'] = null;
        }

        return $data;
    }
}
