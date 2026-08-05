<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\WebsitePageView;
use App\Services\WebsiteBuilder\WebsitePremiumAccessService;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WebsiteTrackingController extends Controller
{
    public function __construct(protected WebsitePremiumAccessService $premiumAccess) {}

    public function track(Request $request, string $slug)
    {
        $data = $request->validate([
            'event_type' => ['required', Rule::in(['page_view', 'section_view', 'download', 'admission_click'])],
            'section_key' => ['nullable', 'string', 'max:100'],
        ]);

        $school = Tenant::runAsPlatform(
            fn () => School::where('slug', $slug)->where('status', 'approved')->first()
        );

        // Silently no-op for a school with no (or no longer active) website
        // access rather than 404ing — this is a fire-and-forget beacon call,
        // not something a visitor's page load should ever fail on.
        if (! $school || $this->premiumAccess->evaluate($school)['code'] !== null) {
            return response()->noContent();
        }

        Tenant::set($school->id);

        WebsitePageView::create([
            'school_id' => $school->id,
            'event_type' => $data['event_type'],
            'section_key' => $data['section_key'] ?? null,
            'referrer' => $request->header('referer') ? substr($request->header('referer'), 0, 512) : null,
        ]);

        return response()->noContent();
    }
}
