<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\ClinicVisitRequest;
use App\Http\Resources\School\ClinicVisitResource;
use App\Models\ClinicVisit;
use Illuminate\Http\Request;

class ClinicVisitController extends Controller
{
    public function index(Request $request)
    {
        $visits = ClinicVisit::query()
            ->with(['student', 'recordedBy'])
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->orderByDesc('visit_date')
            ->paginate($request->integer('per_page', 20));

        return ClinicVisitResource::collection($visits);
    }

    public function store(ClinicVisitRequest $request)
    {
        $visit = ClinicVisit::create([...$request->validated(), 'recorded_by' => $request->user()->id]);

        return new ClinicVisitResource($visit->load(['student', 'recordedBy']));
    }

    public function update(ClinicVisitRequest $request, ClinicVisit $clinic_visit)
    {
        $clinic_visit->update($request->validated());

        return new ClinicVisitResource($clinic_visit->load(['student', 'recordedBy']));
    }

    public function destroy(Request $request, ClinicVisit $clinic_visit)
    {
        abort_unless($request->user()->can('clinic.manage'), 403);

        $clinic_visit->delete();

        return response()->noContent();
    }
}
