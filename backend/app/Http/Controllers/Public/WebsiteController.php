<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\WebsiteBuilder\WebsiteAcademicDepartmentInfoResource;
use App\Http\Resources\WebsiteBuilder\WebsiteAdmissionClassResource;
use App\Http\Resources\WebsiteBuilder\WebsiteBannerResource;
use App\Http\Resources\WebsiteBuilder\WebsiteCalendarEventResource;
use App\Http\Resources\WebsiteBuilder\WebsiteDownloadResource;
use App\Http\Resources\WebsiteBuilder\WebsiteFacilityResource;
use App\Http\Resources\WebsiteBuilder\WebsiteGalleryAlbumResource;
use App\Http\Resources\WebsiteBuilder\WebsiteLeadershipMemberResource;
use App\Http\Resources\WebsiteBuilder\WebsiteNewsResource;
use App\Http\Resources\WebsiteBuilder\WebsiteOfficeResource;
use App\Http\Resources\WebsiteBuilder\WebsitePolicyResource;
use App\Http\Resources\WebsiteBuilder\WebsiteResearchProjectResource;
use App\Http\Resources\WebsiteBuilder\WebsiteSettingsResource;
use App\Http\Resources\WebsiteBuilder\WebsiteSportsMediaResource;
use App\Http\Resources\WebsiteBuilder\WebsiteSportsProgramResource;
use App\Http\Resources\WebsiteBuilder\WebsiteTestimonialResource;
use App\Models\ExamResult;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Models\WebsiteAcademicDepartmentInfo;
use App\Models\WebsiteAdmissionClass;
use App\Models\WebsiteBanner;
use App\Models\WebsiteCalendarEvent;
use App\Models\WebsiteDownload;
use App\Models\WebsiteFacility;
use App\Models\WebsiteGalleryAlbum;
use App\Models\WebsiteLeadershipMember;
use App\Models\WebsiteNews;
use App\Models\WebsiteOffice;
use App\Models\WebsitePolicy;
use App\Models\WebsiteResearchProject;
use App\Models\WebsiteSection;
use App\Models\WebsiteSettings;
use App\Models\WebsiteSportsMedia;
use App\Models\WebsiteSportsProgram;
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
            'performance_insights' => $this->performanceInsights($school, $settings),
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
            'admission_classes' => WebsiteAdmissionClassResource::collection(
                WebsiteAdmissionClass::with('schoolClass')->where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'academic_departments' => WebsiteAcademicDepartmentInfoResource::collection(
                WebsiteAcademicDepartmentInfo::with('department.subjects')->where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'leadership' => WebsiteLeadershipMemberResource::collection(
                WebsiteLeadershipMember::where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'policies' => WebsitePolicyResource::collection(
                WebsitePolicy::where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'sports_programs' => WebsiteSportsProgramResource::collection(
                WebsiteSportsProgram::where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'sports_media' => WebsiteSportsMediaResource::collection(
                WebsiteSportsMedia::where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'offices' => WebsiteOfficeResource::collection(
                WebsiteOffice::where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'research_items' => WebsiteResearchProjectResource::collection(
                WebsiteResearchProject::where('category', 'research')->where('is_visible', true)->orderBy('sort_order')->get()
            ),
            'projects' => WebsiteResearchProjectResource::collection(
                WebsiteResearchProject::where('category', 'project')->where('is_visible', true)->orderBy('sort_order')->get()
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

    /**
     * Only computed at the same 'publish' tier that already unlocks
     * academic_average in stats() — a school that wants pass-rate/grade
     * breakdowns public opts into the fuller trend/subject/grade charts too,
     * rather than adding a second visibility knob. Scoped to completed or
     * published exams only (never draft/scheduled) so a marketing page can
     * never show results that are still being entered or aren't finalized
     * yet, and reuses the exact join pattern AnalyticsController::academics()
     * already uses for the admin dashboard's own charts, so the numbers
     * here always agree with what staff see internally.
     */
    protected function performanceInsights(School $school, ?WebsiteSettings $settings): ?array
    {
        if (! $settings || $settings->stats_visibility !== 'publish') {
            return null;
        }

        return Cache::remember("website-performance-insights:{$school->id}", 900, function () {
            $yearRows = ExamResult::query()
                ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
                ->join('exams', 'exams.id', '=', 'exam_subjects.exam_id')
                ->join('academic_years', 'academic_years.id', '=', 'exams.academic_year_id')
                ->whereIn('exams.status', ['completed', 'published'])
                ->whereNotNull('exam_results.marks_obtained')
                ->selectRaw(
                    'academic_years.id as year_id, academic_years.name as label, academic_years.start_date as start_date,
                    count(*) as total,
                    sum(case when exam_results.marks_obtained >= exam_subjects.pass_marks then 1 else 0 end) as passed'
                )
                ->groupBy('academic_years.id', 'academic_years.name', 'academic_years.start_date')
                ->orderBy('academic_years.start_date')
                ->get();

            $passRateTrend = $yearRows
                ->map(fn ($row) => ['label' => $row->label, 'pass_rate' => $row->total > 0 ? round($row->passed / $row->total * 100, 1) : null])
                ->filter(fn ($row) => $row['pass_rate'] !== null)
                ->slice(-6)
                ->values();

            // The most recent year that actually has finalized results —
            // not just the latest AcademicYear row, which may be the new
            // year with nothing graded yet.
            $latestYearId = $yearRows->last()?->year_id;

            if (! $latestYearId) {
                return ['pass_rate_trend' => [], 'subject_performance' => [], 'grade_distribution' => []];
            }

            $subjectPerformance = ExamResult::query()
                ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
                ->join('subjects', 'subjects.id', '=', 'exam_subjects.subject_id')
                ->join('exams', 'exams.id', '=', 'exam_subjects.exam_id')
                ->where('exams.academic_year_id', $latestYearId)
                ->whereIn('exams.status', ['completed', 'published'])
                ->whereNotNull('exam_results.marks_obtained')
                ->selectRaw('subjects.name as label, avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
                ->groupBy('subjects.name')
                ->orderByDesc('average_percentage')
                ->limit(8)
                ->get()
                ->map(fn ($row) => ['label' => $row->label, 'average_percentage' => round((float) $row->average_percentage, 1)]);

            $gradeDistribution = ExamResult::query()
                ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
                ->join('exams', 'exams.id', '=', 'exam_subjects.exam_id')
                ->where('exams.academic_year_id', $latestYearId)
                ->whereIn('exams.status', ['completed', 'published'])
                ->whereNotNull('exam_results.grade')
                ->selectRaw('exam_results.grade as label, count(*) as count')
                ->groupBy('exam_results.grade')
                ->orderBy('exam_results.grade')
                ->get();

            return [
                'pass_rate_trend' => $passRateTrend,
                'subject_performance' => $subjectPerformance,
                'grade_distribution' => $gradeDistribution,
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
