<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\StaffContractRequest;
use App\Http\Resources\School\StaffContractResource;
use App\Models\StaffContract;
use App\Models\StaffProfile;
use Illuminate\Http\Request;

class StaffContractController extends Controller
{
    public function index(Request $request, StaffProfile $staff)
    {
        abort_unless($request->user()->can('staff.manage'), 403);

        return StaffContractResource::collection(
            $staff->user->contracts()->latest('start_date')->get()
        );
    }

    public function store(StaffContractRequest $request)
    {
        $contract = StaffContract::create($request->validated());

        return new StaffContractResource($contract->load('user'));
    }

    public function destroy(Request $request, StaffContract $contract)
    {
        abort_unless($request->user()->can('staff.manage'), 403);

        $contract->delete();

        return response()->noContent();
    }
}
