<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\UpdateSchoolProfileRequest;
use App\Http\Resources\Platform\SchoolResource;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolProfileController extends Controller
{
    public function show(Request $request)
    {
        return new SchoolResource($this->currentSchool($request));
    }

    public function update(UpdateSchoolProfileRequest $request)
    {
        $school = $this->currentSchool($request);
        $school->update($request->validated());

        return new SchoolResource($school);
    }

    protected function currentSchool(Request $request): School
    {
        abort_unless($request->user()->school_id, 403, 'This account is not attached to a school.');

        return School::findOrFail($request->user()->school_id);
    }
}
