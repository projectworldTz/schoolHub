<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\HostelRoomRequest;
use App\Http\Resources\School\HostelRoomResource;
use App\Models\HostelRoom;
use Illuminate\Http\Request;

class HostelRoomController extends Controller
{
    public function index()
    {
        $rooms = HostelRoom::query()
            ->withCount('activeAllocations')
            ->orderBy('name')
            ->get();

        return HostelRoomResource::collection($rooms);
    }

    public function store(HostelRoomRequest $request)
    {
        $room = HostelRoom::create($request->validated());

        return new HostelRoomResource($room->loadCount('activeAllocations'));
    }

    public function update(HostelRoomRequest $request, HostelRoom $hostel_room)
    {
        $hostel_room->update($request->validated());

        return new HostelRoomResource($hostel_room->loadCount('activeAllocations'));
    }

    public function destroy(Request $request, HostelRoom $hostel_room)
    {
        abort_unless($request->user()->can('hostel.manage'), 403);

        $hostel_room->delete();

        return response()->noContent();
    }
}
