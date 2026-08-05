<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteBannerRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteBannerResource;
use App\Models\WebsiteBanner;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteBannerController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteBannerResource::collection(WebsiteBanner::orderBy('sort_order')->get());
    }

    public function store(WebsiteBannerRequest $request)
    {
        $data = $request->validated();
        $data['image_path'] = $this->media->store($request->file('image'), 'banners');
        unset($data['image']);

        return new WebsiteBannerResource(WebsiteBanner::create($data));
    }

    public function update(WebsiteBannerRequest $request, WebsiteBanner $banner)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $this->media->delete($banner->image_path);
            $data['image_path'] = $this->media->store($request->file('image'), 'banners');
        }
        unset($data['image']);

        $banner->update($data);

        return new WebsiteBannerResource($banner);
    }

    public function destroy(WebsiteBanner $banner)
    {
        $this->media->delete($banner->image_path);
        $banner->delete();

        return response()->noContent();
    }
}
