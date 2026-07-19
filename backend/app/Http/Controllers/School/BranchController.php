<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\BranchRequest;
use App\Http\Resources\School\BranchResource;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return BranchResource::collection(Branch::query()->orderBy('name')->get());
    }

    public function store(BranchRequest $request)
    {
        return new BranchResource(Branch::create($request->validated()));
    }

    public function show(Branch $branch)
    {
        return new BranchResource($branch);
    }

    public function update(BranchRequest $request, Branch $branch)
    {
        $branch->update($request->validated());

        return new BranchResource($branch);
    }

    public function destroy(Request $request, Branch $branch)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        $branch->delete();

        return response()->noContent();
    }
}
