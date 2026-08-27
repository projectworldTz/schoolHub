<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteAdmissionClassesRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteAdmissionClassResource;
use App\Models\SchoolClass;
use App\Models\WebsiteAdmissionClass;
use App\Support\Tenancy\Tenant;

class WebsiteAdmissionClassController extends Controller
{
    /**
     * One row per real SchoolClass — same fixed-set shape as
     * WebsiteSectionController, so a class with no settings row yet still
     * shows up (as an unsaved, hidden-by-default entry) rather than being
     * missing from the admin list.
     */
    public function index()
    {
        return WebsiteAdmissionClassResource::collection($this->merged());
    }

    public function update(WebsiteAdmissionClassesRequest $request)
    {
        $schoolId = Tenant::id();

        foreach ($request->validated('classes') as $row) {
            WebsiteAdmissionClass::updateOrCreate(
                ['school_id' => $schoolId, 'school_class_id' => $row['school_class_id']],
                [
                    'summary' => $row['summary'] ?? null,
                    'requirements' => $row['requirements'] ?? null,
                    'is_visible' => $row['is_visible'],
                    'sort_order' => $row['sort_order'],
                ]
            );
        }

        return WebsiteAdmissionClassResource::collection($this->merged());
    }

    protected function merged()
    {
        $classes = SchoolClass::orderBy('level')->get();
        $existing = WebsiteAdmissionClass::all()->keyBy('school_class_id');

        return $classes->map(function (SchoolClass $class) use ($existing) {
            $row = $existing->get($class->id) ?? new WebsiteAdmissionClass(['school_class_id' => $class->id]);
            $row->setRelation('schoolClass', $class);

            return $row;
        });
    }
}
