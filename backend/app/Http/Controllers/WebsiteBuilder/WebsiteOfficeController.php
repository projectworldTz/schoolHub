<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteOfficeRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteOfficeResource;
use App\Models\WebsiteOffice;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteOfficeController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteOfficeResource::collection(WebsiteOffice::orderBy('sort_order')->get());
    }

    public function store(WebsiteOfficeRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $data['photo_path'] = $this->media->store($request->file('photo'), 'offices');
        }
        unset($data['photo']);

        return new WebsiteOfficeResource(WebsiteOffice::create($data));
    }

    public function update(WebsiteOfficeRequest $request, WebsiteOffice $office)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $this->media->delete($office->photo_path);
            $data['photo_path'] = $this->media->store($request->file('photo'), 'offices');
        }
        unset($data['photo']);

        $office->update($data);

        return new WebsiteOfficeResource($office);
    }

    public function destroy(WebsiteOffice $office)
    {
        $this->media->delete($office->photo_path);
        $office->delete();

        return response()->noContent();
    }
}
