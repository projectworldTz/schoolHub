<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsitePolicyRequest;
use App\Http\Resources\WebsiteBuilder\WebsitePolicyResource;
use App\Models\WebsitePolicy;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsitePolicyController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsitePolicyResource::collection(WebsitePolicy::orderBy('sort_order')->get());
    }

    public function store(WebsitePolicyRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('document')) {
            $data['document_path'] = $this->media->store($request->file('document'), 'policies');
        }
        unset($data['document']);

        return new WebsitePolicyResource(WebsitePolicy::create($data));
    }

    public function update(WebsitePolicyRequest $request, WebsitePolicy $policy)
    {
        $data = $request->validated();

        if ($request->hasFile('document')) {
            $this->media->delete($policy->document_path);
            $data['document_path'] = $this->media->store($request->file('document'), 'policies');
        }
        unset($data['document']);

        $policy->update($data);

        return new WebsitePolicyResource($policy);
    }

    public function destroy(WebsitePolicy $policy)
    {
        $this->media->delete($policy->document_path);
        $policy->delete();

        return response()->noContent();
    }
}
