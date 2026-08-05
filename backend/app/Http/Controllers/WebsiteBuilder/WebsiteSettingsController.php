<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteSettingsRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteSettingsResource;
use App\Models\WebsiteSection;
use App\Models\WebsiteSettings;
use App\Services\WebsiteBuilder\WebsiteMediaService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;

class WebsiteSettingsController extends Controller
{
    public function __construct(protected WebsiteMediaService $media) {}

    public function show(Request $request)
    {
        return new WebsiteSettingsResource($this->currentSettings());
    }

    public function update(WebsiteSettingsRequest $request)
    {
        $settings = $this->currentSettings();
        $settings->update($request->validated());

        return new WebsiteSettingsResource($settings);
    }

    public function uploadHero(Request $request)
    {
        $data = $request->validate([
            'image' => ['nullable', 'image', 'max:10240'],
            'video' => ['nullable', 'mimetypes:video/mp4,video/quicktime,video/webm', 'max:51200'],
        ]);

        abort_if(empty($data), 422, 'Provide an image or a video.');

        $settings = $this->currentSettings();

        if ($request->hasFile('image')) {
            $this->media->delete($settings->hero_image_path);
            $settings->hero_image_path = $this->media->store($request->file('image'), 'hero');
        }

        if ($request->hasFile('video')) {
            $this->media->delete($settings->hero_video_path);
            $settings->hero_video_path = $this->media->store($request->file('video'), 'hero');
        }

        $settings->save();

        return new WebsiteSettingsResource($settings);
    }

    /**
     * Gets-or-creates the current school's one WebsiteSettings row and
     * makes sure every section key in WebsiteSection::KEYS has a row —
     * called from every CMS endpoint that needs settings, so a school never
     * has to go through an explicit "set up your site" step first.
     */
    protected function currentSettings(): WebsiteSettings
    {
        $schoolId = Tenant::id();

        $settings = WebsiteSettings::firstOrCreate(['school_id' => $schoolId]);
        // firstOrCreate() leaves wasRecentlyCreated=true on a first-ever
        // access, which JsonResource turns into an HTTP 201 — wrong for a
        // show/update endpoint that auto-provisions as an implementation
        // detail, not something the client asked to "create".
        $settings->wasRecentlyCreated = false;

        $existingKeys = WebsiteSection::where('school_id', $schoolId)->pluck('section_key')->all();

        foreach (WebsiteSection::KEYS as $index => $key) {
            if (! in_array($key, $existingKeys, true)) {
                WebsiteSection::create([
                    'school_id' => $schoolId,
                    'section_key' => $key,
                    'is_visible' => true,
                    'sort_order' => $index,
                ]);
            }
        }

        return $settings;
    }
}
