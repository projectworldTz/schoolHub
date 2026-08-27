<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteAcademicDepartmentsRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteAcademicDepartmentInfoResource;
use App\Models\Department;
use App\Models\WebsiteAcademicDepartmentInfo;
use App\Support\Tenancy\Tenant;

class WebsiteAcademicDepartmentController extends Controller
{
    /** One row per real Department — same fixed-set shape as WebsiteAdmissionClassController. */
    public function index()
    {
        return WebsiteAcademicDepartmentInfoResource::collection($this->merged());
    }

    public function update(WebsiteAcademicDepartmentsRequest $request)
    {
        $schoolId = Tenant::id();

        foreach ($request->validated('departments') as $row) {
            WebsiteAcademicDepartmentInfo::updateOrCreate(
                ['school_id' => $schoolId, 'department_id' => $row['department_id']],
                [
                    'public_description' => $row['public_description'] ?? null,
                    'is_visible' => $row['is_visible'],
                    'sort_order' => $row['sort_order'],
                ]
            );
        }

        return WebsiteAcademicDepartmentInfoResource::collection($this->merged());
    }

    protected function merged()
    {
        $departments = Department::with('subjects')->orderBy('name')->get();
        $existing = WebsiteAcademicDepartmentInfo::all()->keyBy('department_id');

        return $departments->map(function (Department $department) use ($existing) {
            $row = $existing->get($department->id) ?? new WebsiteAcademicDepartmentInfo(['department_id' => $department->id]);
            $row->setRelation('department', $department);

            return $row;
        });
    }
}
