<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\TimetablePeriodRequest;
use App\Http\Resources\School\TimetablePeriodResource;
use App\Models\TimetablePeriod;
use Illuminate\Http\Request;

class TimetablePeriodController extends Controller
{
    public function index()
    {
        return TimetablePeriodResource::collection(
            TimetablePeriod::query()->orderBy('sort_order')->orderBy('start_time')->get()
        );
    }

    public function store(TimetablePeriodRequest $request)
    {
        $period = TimetablePeriod::create($request->validated());

        return new TimetablePeriodResource($period);
    }

    public function update(TimetablePeriodRequest $request, TimetablePeriod $timetable_period)
    {
        $timetable_period->update($request->validated());

        return new TimetablePeriodResource($timetable_period);
    }

    public function destroy(Request $request, TimetablePeriod $timetable_period)
    {
        abort_unless($request->user()->can('timetable.manage'), 403);

        $timetable_period->delete();

        return response()->noContent();
    }
}
