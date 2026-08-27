<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteLeadershipRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteLeadershipMemberResource;
use App\Models\WebsiteLeadershipMember;
use App\Services\WebsiteBuilder\WebsiteMediaService;

class WebsiteLeadershipController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function index()
    {
        return WebsiteLeadershipMemberResource::collection(WebsiteLeadershipMember::orderBy('sort_order')->get());
    }

    public function store(WebsiteLeadershipRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $data['photo_path'] = $this->media->store($request->file('photo'), 'leadership');
        }
        unset($data['photo']);

        return new WebsiteLeadershipMemberResource(WebsiteLeadershipMember::create($data));
    }

    public function update(WebsiteLeadershipRequest $request, WebsiteLeadershipMember $leadership)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $this->media->delete($leadership->photo_path);
            $data['photo_path'] = $this->media->store($request->file('photo'), 'leadership');
        }
        unset($data['photo']);

        $leadership->update($data);

        return new WebsiteLeadershipMemberResource($leadership);
    }

    public function destroy(WebsiteLeadershipMember $leadership)
    {
        $this->media->delete($leadership->photo_path);
        $leadership->delete();

        return response()->noContent();
    }
}
