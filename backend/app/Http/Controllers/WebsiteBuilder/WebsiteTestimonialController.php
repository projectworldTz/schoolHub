<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteTestimonialRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteTestimonialResource;
use App\Models\WebsiteTestimonial;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteTestimonialController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteTestimonialResource::collection(WebsiteTestimonial::orderBy('sort_order')->get());
    }

    public function store(WebsiteTestimonialRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $data['photo_path'] = $this->media->store($request->file('photo'), 'testimonials');
        }
        unset($data['photo']);

        return new WebsiteTestimonialResource(WebsiteTestimonial::create($data));
    }

    public function update(WebsiteTestimonialRequest $request, WebsiteTestimonial $testimonial)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $this->media->delete($testimonial->photo_path);
            $data['photo_path'] = $this->media->store($request->file('photo'), 'testimonials');
        }
        unset($data['photo']);

        $testimonial->update($data);

        return new WebsiteTestimonialResource($testimonial);
    }

    public function destroy(WebsiteTestimonial $testimonial)
    {
        $this->media->delete($testimonial->photo_path);
        $testimonial->delete();

        return response()->noContent();
    }
}
