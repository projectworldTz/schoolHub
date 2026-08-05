<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteNewsRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteNewsResource;
use App\Models\WebsiteNews;

/**
 * Curation only — an announcement becomes eligible here by toggling
 * "Publish Public" on the Announcement itself (AnnouncementController),
 * which is what actually creates/removes the WebsiteNews row (see
 * Announcement::booted()'s saved() hook). This controller just lets the
 * Website Builder feature/reorder what's already public.
 */
class WebsiteNewsController extends Controller
{
    public function index()
    {
        return WebsiteNewsResource::collection(
            WebsiteNews::with('announcement')->orderBy('sort_order')->get()
        );
    }

    public function update(WebsiteNewsRequest $request, WebsiteNews $news)
    {
        $news->update($request->validated());

        return new WebsiteNewsResource($news->load('announcement'));
    }
}
