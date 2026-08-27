<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteResearchProjectRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteResearchProjectResource;
use App\Models\WebsiteResearchProject;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteResearchProjectController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    /** Shared by the Research & Innovation and Projects admin tabs, filtered client-side (or via ?category=) by the resource's `category` field. */
    public function index()
    {
        return WebsiteResearchProjectResource::collection(WebsiteResearchProject::orderBy('sort_order')->get());
    }

    public function store(WebsiteResearchProjectRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $this->media->store($request->file('image'), 'research-projects');
        }
        unset($data['image']);

        return new WebsiteResearchProjectResource(WebsiteResearchProject::create($data));
    }

    public function update(WebsiteResearchProjectRequest $request, WebsiteResearchProject $researchProject)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $this->media->delete($researchProject->image_path);
            $data['image_path'] = $this->media->store($request->file('image'), 'research-projects');
        }
        unset($data['image']);

        $researchProject->update($data);

        return new WebsiteResearchProjectResource($researchProject);
    }

    public function destroy(WebsiteResearchProject $researchProject)
    {
        $this->media->delete($researchProject->image_path);
        $researchProject->delete();

        return response()->noContent();
    }
}
