<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AdmissionApplicationRequest;
use App\Http\Resources\School\AdmissionApplicationResource;
use App\Http\Resources\School\StudentResource;
use App\Models\AdmissionApplication;
use App\Services\School\AdmissionService;
use Illuminate\Http\Request;

class AdmissionApplicationController extends Controller
{
    public function __construct(protected AdmissionService $admissions) {}

    public function index(Request $request)
    {
        $applications = AdmissionApplication::query()
            ->with(['academicYear', 'applyingForClass.branch'])
            ->when($request->string('status')->isNotEmpty(), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->input('branch_id'), fn ($q, $id) => $q->whereHas(
                'applyingForClass',
                fn ($q) => $q->where('branch_id', $id)
            ))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return AdmissionApplicationResource::collection($applications);
    }

    public function store(AdmissionApplicationRequest $request)
    {
        $application = AdmissionApplication::create($request->validated());

        return new AdmissionApplicationResource($application);
    }

    public function show(AdmissionApplication $admission)
    {
        return new AdmissionApplicationResource(
            $admission->load(['academicYear', 'applyingForClass', 'reviewer', 'documents'])
        );
    }

    public function update(AdmissionApplicationRequest $request, AdmissionApplication $admission)
    {
        $admission->update($request->validated());

        return new AdmissionApplicationResource($admission);
    }

    public function accept(Request $request, AdmissionApplication $admission)
    {
        abort_unless($request->user()->can('admissions.manage'), 403);

        return new AdmissionApplicationResource($this->admissions->accept($admission));
    }

    public function reject(Request $request, AdmissionApplication $admission)
    {
        abort_unless($request->user()->can('admissions.manage'), 403);

        return new AdmissionApplicationResource($this->admissions->reject($admission, $request->input('notes')));
    }

    public function enroll(Request $request, AdmissionApplication $admission)
    {
        abort_unless($request->user()->can('admissions.manage'), 403);

        $student = $this->admissions->enroll($admission);

        return new StudentResource(
            $student->load(['guardians', 'currentEnrollment.academicYear', 'currentEnrollment.schoolClass', 'currentEnrollment.stream'])
        );
    }
}
