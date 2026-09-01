<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\UpdateSchoolProfileRequest;
use App\Http\Requests\School\UploadSchoolLogoRequest;
use App\Http\Resources\Platform\SchoolResource;
use App\Models\School;
use App\Services\School\SchoolBrandingService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;

class SchoolProfileController extends Controller
{
    public function __construct(protected SchoolBrandingService $branding) {}

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

    public function uploadLogo(UploadSchoolLogoRequest $request)
    {
        return new SchoolResource(
            $this->branding->replace($this->currentSchool($request), $request->file('logo'))
        );
    }

    public function removeLogo(Request $request)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        return new SchoolResource($this->branding->remove($this->currentSchool($request)));
    }

    protected function currentSchool(Request $request): School
    {
        abort_unless(Tenant::id(), 403, 'This account is not attached to a school.');

        return School::findOrFail(Tenant::id());
    }
}
