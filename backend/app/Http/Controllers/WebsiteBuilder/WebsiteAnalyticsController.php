<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Models\WebsiteDownload;
use App\Models\WebsitePageView;
use Illuminate\Support\Facades\DB;

/**
 * Phase-1-basic analytics from website_page_views only — counts and a
 * most-viewed-sections breakdown. No device/country/traffic-source data;
 * that's a later phase (see the module's plan doc).
 */
class WebsiteAnalyticsController extends Controller
{
    public function summary()
    {
        $since = now()->subDays(30);

        $totals = WebsitePageView::where('created_at', '>=', $since)
            ->selectRaw('event_type, count(*) as total')
            ->groupBy('event_type')
            ->pluck('total', 'event_type');

        $dailyViews = WebsitePageView::where('event_type', 'page_view')
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as date, count(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topSections = WebsitePageView::where('event_type', 'section_view')
            ->where('created_at', '>=', $since)
            ->whereNotNull('section_key')
            ->select('section_key', DB::raw('count(*) as total'))
            ->groupBy('section_key')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return response()->json(['data' => [
            'page_views' => (int) ($totals['page_view'] ?? 0),
            'section_views' => (int) ($totals['section_view'] ?? 0),
            'downloads' => (int) ($totals['download'] ?? 0),
            'admission_clicks' => (int) ($totals['admission_click'] ?? 0),
            'daily_views' => $dailyViews,
            'top_sections' => $topSections,
            'top_downloads' => WebsiteDownload::orderByDesc('download_count')->limit(10)->get(['id', 'title', 'download_count']),
        ]]);
    }
}
