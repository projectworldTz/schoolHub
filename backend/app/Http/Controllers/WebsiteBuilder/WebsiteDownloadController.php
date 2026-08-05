<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteDownloadRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteDownloadResource;
use App\Models\WebsiteDownload;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteDownloadController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteDownloadResource::collection(WebsiteDownload::orderBy('sort_order')->get());
    }

    public function store(WebsiteDownloadRequest $request)
    {
        $data = $request->validated();
        $file = $request->file('file');
        $data['file_path'] = $this->media->store($file, 'downloads');
        $data['file_size'] = $file->getSize();
        unset($data['file']);

        return new WebsiteDownloadResource(WebsiteDownload::create($data));
    }

    public function update(WebsiteDownloadRequest $request, WebsiteDownload $download)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            $this->media->delete($download->file_path);
            $file = $request->file('file');
            $data['file_path'] = $this->media->store($file, 'downloads');
            $data['file_size'] = $file->getSize();
        }
        unset($data['file']);

        $download->update($data);

        return new WebsiteDownloadResource($download);
    }

    public function destroy(WebsiteDownload $download)
    {
        $this->media->delete($download->file_path);
        $download->delete();

        return response()->noContent();
    }
}
