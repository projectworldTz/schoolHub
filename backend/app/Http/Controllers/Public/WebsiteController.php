<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\WebsiteBuilder\WebsiteBannerResource;
use App\Http\Resources\WebsiteBuilder\WebsiteCalendarEventResource;
use App\Http\Resources\WebsiteBuilder\WebsiteDownloadResource;
use App\Http\Resources\WebsiteBuilder\WebsiteFacilityResource;
use App\Http\Resources\WebsiteBuilder\WebsiteGalleryAlbumResource;
use App\Http\Resources\WebsiteBuilder\WebsiteNewsResource;
use App\Http\Resources\WebsiteBuilder\WebsiteSettingsResource;
use App\Http\Resources\WebsiteBuilder\WebsiteTestimonialResource;
use App\Models\ExamResult;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Models\WebsiteBanner;
use App\Models\WebsiteCalendarEvent;
use App\Models\WebsiteDownload;
use App\Models\WebsiteFacility;
use App\Models\WebsiteGalleryAlbum;
use App\Models\WebsiteNews;
use App\Models\WebsiteSection;
use App\Models\WebsiteSettings;
use App\Models\WebsiteTestimonial;
use App\Services\WebsiteBuilder\WebsiteMediaService;
use App\Services\WebsiteBuilder\WebsitePremiumAccessService;
use App\Support\Tenancy\Tenant;
use Illuminate\Support\Facades\Cache;

/**
 * Same slug-in-path + manual-tenant-resolve idiom as
 * Public\NoticeBoardController — see that class for why {slug} is resolved
 * manually rather than via route-model-binding. A school 404s here unless
 * BOTH website_enabled is currently 'active' (the Platform-granted premium
 * gate) AND website_settings.is_published is true (the school's own "site
 * is live" switch) — a school can have the module without choosing to
 * publish yet.
 */
class WebsiteController extends Controller
{
    public function __construct(protected WebsitePremiumAccessService $premiumAccess, protected WebsiteMediaService $media) {}

    public function show(string $slug)
    {
        $school = $this->resolvePublishedSite($slug);
        $settings = WebsiteSettings::where('school_id', $school->id)->first();

        $sections = WebsiteSection::where('is_visible', true)->orderBy('sort_order')->get();

        return response()->json(['data' => [
            'school' => [
                'name' => $school->name,
                'slug' => $school->slug,
                'logo_url' => $this->media->url($school->logo_path),
                'email' => $school->email,
                'phone' => $school->phone,
                'address' => $school->address,
                'city' => $school->city,
                'country' => $school->country,
            ],
            'settings' => new WebsiteSettingsResource($settings),
            'sections' => $sections->pluck('section_key'),
            'stats' => $this->stats($school, $settings),
            'facilities' => WebsiteFacilityResource::collection(WebsiteFacility::orderBy('sort_order')->get()),
            'gallery_albums' => WebsiteGalleryAlbumResource::collection(
                WebsiteGalleryAlbum::with('images')->withCount('images')->orderBy('sort_order')->get()
            ),
            'banners' => WebsiteBannerResource::collection(WebsiteBanner::where('is_active', true)->orderBy('sort_order')->get()),
            'testimonials' => WebsiteTestimonialResource::collection(WebsiteTestimonial::where('is_published', true)->orderBy('sort_order')->get()),
            'downloads' => WebsiteDownloadResource::collection(WebsiteDownload::orderBy('sort_order')->get()),
            'calendar_events' => WebsiteCalendarEventResource::collection(
                WebsiteCalendarEvent::where('start_date', '>=', now()->subMonths(1))->orderBy('start_date')->get()
            ),
            'news' => WebsiteNewsResource::collection(
                WebsiteNews::with('announcement')->orderByDesc('is_featured')->orderBy('sort_order')->get()
            ),
        ]]);
    }

    /**
     * Live-computed, cached for 15 minutes — these are non-trivial aggregate
     * queries (see AnalyticsController::byBranch() for the same pattern)
     * that don't need to be second-by-second fresh on a marketing page.
     * Respects stats_visibility: 'hide' returns nothing, 'summary_only'
     * drops the pass-rate breakdown a school might not want public.
     */
    protected function stats(School $school, ?WebsiteSettings $settings): ?array
    {
        if (! $settings || $settings->stats_visibility === 'hide') {
            return null;
        }

        return Cache::remember("website-stats:{$school->id}", 900, function () use ($settings) {
            $studentCount = Student::where('status', 'active')->count();
            $teacherCount = User::role(['Teacher', 'Class Teacher'])->count();
            $graduateCount = Student::where('status', 'graduated')->count();

            $academicAverage = ExamResult::query()
                ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
                ->whereNotNull('exam_results.marks_obtained')
                ->selectRaw('avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
                ->value('average_percentage');

            $passRate = ExamResult::query()
                ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
                ->whereNotNull('exam_results.marks_obtained')
                ->selectRaw('sum(case when exam_results.marks_obtained >= exam_subjects.pass_marks then 1 else 0 end) / count(*) * 100 as pass_rate')
                ->value('pass_rate');

            $summary = [
                'student_count' => $studentCount,
                'teacher_count' => $teacherCount,
                'graduate_count' => $graduateCount,
                'pass_rate' => $passRate !== null ? round((float) $passRate, 1) : null,
            ];

            if ($settings->stats_visibility === 'summary_only') {
                return $summary;
            }

            return $summary + [
                'academic_average' => $academicAverage !== null ? round((float) $academicAverage, 1) : null,
            ];
        });
    }

    protected function resolvePublishedSite(string $slug): School
    {
        $school = Tenant::runAsPlatform(
            fn () => School::where('slug', $slug)->where('status', 'approved')->firstOrFail()
        );

        abort_unless($this->premiumAccess->evaluate($school)['code'] === null, 404);

        Tenant::set($school->id);

        $settings = WebsiteSettings::where('school_id', $school->id)->first();
        abort_unless($settings && $settings->is_published, 404);

        return $school;
    }
}
