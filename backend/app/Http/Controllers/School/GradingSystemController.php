<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\GradingSystemRequest;
use App\Http\Resources\School\GradingSystemResource;
use App\Models\GradingSystem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradingSystemController extends Controller
{
    public function index()
    {
        return GradingSystemResource::collection(
            GradingSystem::query()->with('gradeBands')->orderBy('name')->get()
        );
    }

    public function store(GradingSystemRequest $request)
    {
        $data = $request->validated();

        $gradingSystem = DB::transaction(function () use ($data) {
            if ($data['is_default'] ?? false) {
                GradingSystem::query()->update(['is_default' => false]);
            }

            $gradingSystem = GradingSystem::create([
                'name' => $data['name'],
                'is_default' => $data['is_default'] ?? false,
            ]);

            $gradingSystem->gradeBands()->createMany($data['grade_bands']);

            return $gradingSystem;
        });

        return new GradingSystemResource($gradingSystem->load('gradeBands'));
    }

    public function show(GradingSystem $gradingSystem)
    {
        return new GradingSystemResource($gradingSystem->load('gradeBands'));
    }

    public function update(GradingSystemRequest $request, GradingSystem $gradingSystem)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $gradingSystem) {
            if ($data['is_default'] ?? false) {
                GradingSystem::query()->whereKeyNot($gradingSystem->id)->update(['is_default' => false]);
            }

            $gradingSystem->update([
                'name' => $data['name'],
                'is_default' => $data['is_default'] ?? false,
            ]);

            $gradingSystem->gradeBands()->delete();
            $gradingSystem->gradeBands()->createMany($data['grade_bands']);
        });

        return new GradingSystemResource($gradingSystem->load('gradeBands'));
    }

    public function destroy(Request $request, GradingSystem $gradingSystem)
    {
        abort_unless($request->user()->can('subjects.manage'), 403);

        $gradingSystem->delete();

        return response()->noContent();
    }
}
