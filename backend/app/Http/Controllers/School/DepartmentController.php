<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\DepartmentRequest;
use App\Http\Resources\School\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return DepartmentResource::collection(
            Department::query()->with('head')->orderBy('name')->get()
        );
    }

    public function store(DepartmentRequest $request)
    {
        return new DepartmentResource(Department::create($request->validated()));
    }

    public function show(Department $department)
    {
        return new DepartmentResource($department->load('head'));
    }

    public function update(DepartmentRequest $request, Department $department)
    {
        $department->update($request->validated());

        return new DepartmentResource($department);
    }

    public function destroy(Request $request, Department $department)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        $department->delete();

        return response()->noContent();
    }
}
