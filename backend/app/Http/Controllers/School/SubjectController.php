<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\SubjectRequest;
use App\Http\Resources\School\SubjectResource;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        return SubjectResource::collection(Subject::query()->orderBy('name')->get());
    }

    public function store(SubjectRequest $request)
    {
        return new SubjectResource(Subject::create($request->validated()));
    }

    public function show(Subject $subject)
    {
        return new SubjectResource($subject);
    }

    public function update(SubjectRequest $request, Subject $subject)
    {
        $subject->update($request->validated());

        return new SubjectResource($subject);
    }

    public function destroy(Request $request, Subject $subject)
    {
        abort_unless($request->user()->can('subjects.manage'), 403);

        $subject->delete();

        return response()->noContent();
    }
}
