<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AllocateHostelRoomRequest;
use App\Http\Resources\School\HostelAllocationResource;
use App\Models\HostelAllocation;
use App\Services\School\HostelService;
use Illuminate\Http\Request;

class HostelAllocationController extends Controller
{
    public function __construct(protected HostelService $hostelService) {}

    public function index(Request $request)
    {
        $allocations = HostelAllocation::query()
            ->with(['student', 'room', 'academicYear'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->when($request->input('hostel_room_id'), fn ($q, $id) => $q->where('hostel_room_id', $id))
            ->orderByDesc('allocated_at')
            ->paginate($request->integer('per_page', 20));

        return HostelAllocationResource::collection($allocations);
    }

    public function store(AllocateHostelRoomRequest $request)
    {
        $allocation = $this->hostelService->allocate($request->validated());

        return new HostelAllocationResource($allocation->load(['student', 'room', 'academicYear']));
    }

    public function vacate(Request $request, HostelAllocation $allocation)
    {
        abort_unless($request->user()->can('hostel.manage'), 403);

        $allocation = $this->hostelService->vacate($allocation);

        return new HostelAllocationResource($allocation->load(['student', 'room', 'academicYear']));
    }
}
