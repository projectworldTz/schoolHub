<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StoreSchoolRequest;
use App\Http\Requests\Platform\SuspendSchoolRequest;
use App\Http\Requests\Platform\UpdateSchoolRequest;
use App\Http\Resources\Platform\SchoolResource;
use App\Models\School;
use App\Services\Platform\SchoolService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function __construct(protected SchoolService $schools) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', School::class);

        // The owner relation queries the (tenant-scoped) users table; a
        // Super Admin has no school_id of their own, so without this the
        // global scope would filter it to school_id IS NULL and every
        // school would appear ownerless. See App\Support\Tenancy\Tenant.
        $schools = Tenant::runAsPlatform(fn () => School::query()
            ->with('owner')
            ->when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->where('name', 'like', '%'.$request->string('search').'%'))
            ->latest()
            ->paginate($request->integer('per_page', 20)));

        return SchoolResource::collection($schools);
    }

    public function store(StoreSchoolRequest $request)
    {
        $school = $this->schools->create($request->validated());

        return new SchoolResource($school);
    }

    public function show(School $school)
    {
        $this->authorize('view', $school);

        Tenant::runAsPlatform(fn () => $school->load('owner'));

        return new SchoolResource($school);
    }

    public function update(UpdateSchoolRequest $request, School $school)
    {
        $school = $this->schools->update($school, $request->validated());

        return new SchoolResource($school);
    }

    public function destroy(School $school)
    {
        $this->authorize('delete', $school);

        $school->delete();

        return response()->noContent();
    }

    public function approve(School $school)
    {
        $this->authorize('approve', $school);

        return new SchoolResource($this->schools->approve($school));
    }

    public function suspend(SuspendSchoolRequest $request, School $school)
    {
        return new SchoolResource($this->schools->suspend($school, $request->validated('reason')));
    }
}
