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
    public function index(Request $request)
    {
        return SchoolClassResource::collection(
            SchoolClass::query()
                ->with(['subjects', 'branch'])
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
        return new SchoolClassResource($class->load(['subjects', 'streams', 'branch']));
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
