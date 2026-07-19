<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Resources\School\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('audit-log.view'), 403);

        $logs = ActivityLog::query()
            ->with('user')
            ->when($request->input('subject_type'), fn ($q, $type) => $q->where('subject_type', 'like', "%{$type}"))
            ->when($request->input('action'), fn ($q, $action) => $q->where('action', $action))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 25));

        return ActivityLogResource::collection($logs);
    }

    /** Distinct subject types actually present, for the frontend's filter dropdown. */
    public function subjectTypes(Request $request)
    {
        abort_unless($request->user()->can('audit-log.view'), 403);

        $types = ActivityLog::query()->distinct()->pluck('subject_type')->map(fn ($t) => class_basename($t))->sort()->values();

        return response()->json(['data' => $types]);
    }
}
