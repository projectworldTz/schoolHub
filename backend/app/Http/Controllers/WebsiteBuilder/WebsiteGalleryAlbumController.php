<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteGalleryAlbumRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteGalleryAlbumResource;
use App\Models\WebsiteGalleryAlbum;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteGalleryAlbumController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteGalleryAlbumResource::collection(
            WebsiteGalleryAlbum::withCount('images')->orderBy('sort_order')->get()
        );
    }

    public function store(WebsiteGalleryAlbumRequest $request)
    {
        return new WebsiteGalleryAlbumResource(WebsiteGalleryAlbum::create($request->validated()));
    }

    public function update(WebsiteGalleryAlbumRequest $request, WebsiteGalleryAlbum $gallery_album)
    {
        $gallery_album->update($request->validated());

        return new WebsiteGalleryAlbumResource($gallery_album);
    }

    public function destroy(WebsiteGalleryAlbum $gallery_album)
    {
        foreach ($gallery_album->images as $image) {
            $this->media->delete($image->image_path);
        }
        $gallery_album->images()->delete();
        $gallery_album->delete();

        return response()->noContent();
    }
}
