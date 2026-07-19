<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AcademicYearRequest;
use App\Http\Resources\School\AcademicYearResource;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index()
    {
        return AcademicYearResource::collection(
            AcademicYear::query()->orderByDesc('start_date')->get()
        );
    }

    public function store(AcademicYearRequest $request)
    {
        $data = $request->validated();

        if ($data['is_current'] ?? false) {
            AcademicYear::query()->update(['is_current' => false]);
        }

        return new AcademicYearResource(AcademicYear::create($data));
    }

    public function show(AcademicYear $academicYear)
    {
        return new AcademicYearResource($academicYear->load('terms'));
    }

    public function update(AcademicYearRequest $request, AcademicYear $academicYear)
    {
        $data = $request->validated();

        if ($data['is_current'] ?? false) {
            AcademicYear::query()->whereKeyNot($academicYear->id)->update(['is_current' => false]);
        }

        $academicYear->update($data);

        return new AcademicYearResource($academicYear);
    }

    public function destroy(Request $request, AcademicYear $academicYear)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        $academicYear->delete();

        return response()->noContent();
    }
}
