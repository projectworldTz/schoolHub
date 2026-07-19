<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\HolidayRequest;
use App\Http\Resources\School\HolidayResource;
use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index()
    {
        return HolidayResource::collection(
            Holiday::query()->orderBy('start_date')->get()
        );
    }

    public function store(HolidayRequest $request)
    {
        return new HolidayResource(Holiday::create($request->validated()));
    }

    public function show(Holiday $holiday)
    {
        return new HolidayResource($holiday);
    }

    public function update(HolidayRequest $request, Holiday $holiday)
    {
        $holiday->update($request->validated());

        return new HolidayResource($holiday);
    }

    public function destroy(Request $request, Holiday $holiday)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        $holiday->delete();

        return response()->noContent();
    }
}
