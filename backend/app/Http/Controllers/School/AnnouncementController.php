<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AnnouncementRequest;
use App\Http\Resources\School\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Any authenticated school user can read the announcement list —
     * audience-based filtering of "which announcements are relevant to me"
     * belongs with the Parent Portal (Phase 4), which is the first consumer
     * that needs it. For now this is the staff-facing feed used to author
     * and review what's been posted.
     */
    public function index()
    {
        $announcements = Announcement::query()
            ->with(['schoolClass', 'creator'])
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get();

        return AnnouncementResource::collection($announcements);
    }

    public function store(AnnouncementRequest $request)
    {
        $announcement = Announcement::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'published_at' => $request->validated('published_at') ?? now(),
        ]);

        return new AnnouncementResource($announcement->load(['schoolClass', 'creator']));
    }

    public function update(AnnouncementRequest $request, Announcement $announcement)
    {
        $announcement->update($request->validated());

        return new AnnouncementResource($announcement->load(['schoolClass', 'creator']));
    }

    public function destroy(Request $request, Announcement $announcement)
    {
        abort_unless($request->user()->can('announcements.manage'), 403);

        $announcement->delete();

        return response()->noContent();
    }
}
