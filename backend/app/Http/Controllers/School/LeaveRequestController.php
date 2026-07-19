<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\LeaveRequestRequest;
use App\Http\Requests\School\ReviewLeaveRequest;
use App\Http\Resources\School\LeaveRequestResource;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LeaveRequestController extends Controller
{
    /** Staff with staff.manage see everyone's requests; others see only their own. */
    public function index(Request $request)
    {
        $query = LeaveRequest::query()->with(['user', 'reviewer'])->latest('start_date');

        if (! $request->user()->can('staff.manage')) {
            $query->where('user_id', $request->user()->id);
        }

        return LeaveRequestResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function store(LeaveRequestRequest $request)
    {
        $leave = $request->user()->leaveRequests()->create($request->validated());

        return new LeaveRequestResource($leave);
    }

    public function review(ReviewLeaveRequest $request, LeaveRequest $leaveRequest)
    {
        $leaveRequest->update([
            'status' => $request->validated('status'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Carbon::now(),
        ]);

        return new LeaveRequestResource($leaveRequest->load(['user', 'reviewer']));
    }

    public function destroy(Request $request, LeaveRequest $leaveRequest)
    {
        abort_unless(
            $leaveRequest->user_id === $request->user()->id || $request->user()->can('staff.manage'),
            403
        );

        $leaveRequest->delete();

        return response()->noContent();
    }
}
