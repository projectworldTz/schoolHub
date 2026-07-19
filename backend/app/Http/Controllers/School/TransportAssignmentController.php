<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AssignTransportRequest;
use App\Http\Resources\School\TransportAssignmentResource;
use App\Models\TransportAssignment;
use App\Services\School\TransportService;
use Illuminate\Http\Request;

class TransportAssignmentController extends Controller
{
    public function __construct(protected TransportService $transportService) {}

    public function index(Request $request)
    {
        $assignments = TransportAssignment::query()
            ->with(['student', 'route', 'academicYear'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->when($request->input('transport_route_id'), fn ($q, $id) => $q->where('transport_route_id', $id))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return TransportAssignmentResource::collection($assignments);
    }

    public function store(AssignTransportRequest $request)
    {
        $assignment = $this->transportService->assign($request->validated());

        return new TransportAssignmentResource($assignment->load(['student', 'route', 'academicYear']));
    }

    public function unassign(Request $request, TransportAssignment $assignment)
    {
        abort_unless($request->user()->can('transport.manage'), 403);

        $assignment = $this->transportService->unassign($assignment);

        return new TransportAssignmentResource($assignment->load(['student', 'route', 'academicYear']));
    }
}
