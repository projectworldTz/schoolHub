<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteGalleryImageRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteGalleryImageResource;
use App\Models\WebsiteGalleryAlbum;
use App\Models\WebsiteGalleryImage;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteGalleryImageController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function store(WebsiteGalleryImageRequest $request, WebsiteGalleryAlbum $galleryAlbum)
    {
        $data = $request->validated();
        $data['website_gallery_album_id'] = $galleryAlbum->id;
        $data['image_path'] = $this->media->store($request->file('image'), 'gallery');
        unset($data['image']);

        return new WebsiteGalleryImageResource($galleryAlbum->images()->create($data));
    }

    public function update(WebsiteGalleryImageRequest $request, WebsiteGalleryImage $image)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $this->media->delete($image->image_path);
            $data['image_path'] = $this->media->store($request->file('image'), 'gallery');
        }
        unset($data['image']);

        $image->update($data);

        return new WebsiteGalleryImageResource($image);
    }

    public function destroy(WebsiteGalleryImage $image)
    {
        $this->media->delete($image->image_path);
        $image->delete();

        return response()->noContent();
    }
}
