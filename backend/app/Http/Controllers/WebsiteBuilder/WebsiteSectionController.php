<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteSectionsRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteSectionResource;
use App\Models\WebsiteSection;
use App\Support\Tenancy\Tenant;

class WebsiteSectionController extends Controller
{
    public function index()
    {
        return WebsiteSectionResource::collection(
            WebsiteSection::orderBy('sort_order')->get()
        );
    }

    /**
     * Bulk upsert — the Sections page reorders/toggles everything at once
     * (drag-and-drop), not one row at a time.
     */
    public function update(WebsiteSectionsRequest $request)
    {
        $schoolId = Tenant::id();

        foreach ($request->validated('sections') as $section) {
            WebsiteSection::updateOrCreate(
                ['school_id' => $schoolId, 'section_key' => $section['section_key']],
                ['is_visible' => $section['is_visible'], 'sort_order' => $section['sort_order']],
            );
        }

        return WebsiteSectionResource::collection(
            WebsiteSection::orderBy('sort_order')->get()
        );
    }
}
