<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\RoomRequest;
use App\Http\Resources\School\RoomResource;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index()
    {
        return RoomResource::collection(Room::query()->orderBy('name')->get());
    }

    public function store(RoomRequest $request)
    {
        return new RoomResource(Room::create($request->validated()));
    }

    public function show(Room $room)
    {
        return new RoomResource($room);
    }

    public function update(RoomRequest $request, Room $room)
    {
        $room->update($request->validated());

        return new RoomResource($room);
    }

    public function destroy(Request $request, Room $room)
    {
        abort_unless($request->user()->can('classes.manage'), 403);

        $room->delete();

        return response()->noContent();
    }
}
