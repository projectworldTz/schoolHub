<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteSportsMediaRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteSportsMediaResource;
use App\Models\WebsiteSportsMedia;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteSportsMediaController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteSportsMediaResource::collection(WebsiteSportsMedia::orderBy('sort_order')->get());
    }

    public function store(WebsiteSportsMediaRequest $request)
    {
        $data = $request->validated();
        $data['file_path'] = $this->media->store($request->file('file'), 'sports');
        unset($data['file']);

        return new WebsiteSportsMediaResource(WebsiteSportsMedia::create($data));
    }

    public function update(WebsiteSportsMediaRequest $request, WebsiteSportsMedia $sportsMedium)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            $this->media->delete($sportsMedium->file_path);
            $data['file_path'] = $this->media->store($request->file('file'), 'sports');
        }
        unset($data['file']);

        $sportsMedium->update($data);

        return new WebsiteSportsMediaResource($sportsMedium);
    }

    public function destroy(WebsiteSportsMedia $sportsMedium)
    {
        $this->media->delete($sportsMedium->file_path);
        $sportsMedium->delete();

        return response()->noContent();
    }
}
