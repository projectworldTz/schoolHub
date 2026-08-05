<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteFacilityRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteFacilityResource;
use App\Models\WebsiteFacility;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteFacilityController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteFacilityResource::collection(WebsiteFacility::orderBy('sort_order')->get());
    }

    public function store(WebsiteFacilityRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $this->media->store($request->file('image'), 'facilities');
        }
        unset($data['image']);

        return new WebsiteFacilityResource(WebsiteFacility::create($data));
    }

    public function update(WebsiteFacilityRequest $request, WebsiteFacility $facility)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $this->media->delete($facility->image_path);
            $data['image_path'] = $this->media->store($request->file('image'), 'facilities');
        }
        unset($data['image']);

        $facility->update($data);

        return new WebsiteFacilityResource($facility);
    }

    public function destroy(WebsiteFacility $facility)
    {
        $this->media->delete($facility->image_path);
        $facility->delete();

        return response()->noContent();
    }
}
