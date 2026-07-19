<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\TermRequest;
use App\Http\Resources\School\TermResource;
use App\Models\AcademicYear;
use App\Models\Term;
use Illuminate\Http\Request;

class TermController extends Controller
{
    public function index(AcademicYear $academicYear)
    {
        return TermResource::collection(
            $academicYear->terms()->orderBy('start_date')->get()
        );
    }

    public function store(TermRequest $request, AcademicYear $academicYear)
    {
        $data = $request->validated();

        if ($data['is_current'] ?? false) {
            Term::query()->update(['is_current' => false]);
        }

        $term = $academicYear->terms()->create($data);

        return new TermResource($term);
    }

    public function show(Term $term)
    {
        return new TermResource($term);
    }

    public function update(TermRequest $request, Term $term)
    {
        $data = $request->validated();

        if ($data['is_current'] ?? false) {
            Term::query()->whereKeyNot($term->id)->update(['is_current' => false]);
        }

        $term->update($data);

        return new TermResource($term);
    }

    public function destroy(Request $request, Term $term)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        $term->delete();

        return response()->noContent();
    }
}
