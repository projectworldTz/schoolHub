<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\DisciplineIncidentRequest;
use App\Http\Resources\School\DisciplineIncidentResource;
use App\Models\DisciplineIncident;
use Illuminate\Http\Request;

class DisciplineIncidentController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('discipline.manage'), 403);

        $incidents = DisciplineIncident::query()
            ->with(['student', 'reportedBy'])
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('incident_date')
            ->paginate($request->integer('per_page', 20));

        return DisciplineIncidentResource::collection($incidents);
    }

    public function store(DisciplineIncidentRequest $request)
    {
        $incident = DisciplineIncident::create([...$request->validated(), 'reported_by' => $request->user()->id]);

        return new DisciplineIncidentResource($incident->load(['student', 'reportedBy']));
    }

    public function update(DisciplineIncidentRequest $request, DisciplineIncident $discipline_incident)
    {
        $discipline_incident->update($request->validated());

        return new DisciplineIncidentResource($discipline_incident->load(['student', 'reportedBy']));
    }

    public function destroy(Request $request, DisciplineIncident $discipline_incident)
    {
        abort_unless($request->user()->can('discipline.manage'), 403);

        $discipline_incident->delete();

        return response()->noContent();
    }
}
