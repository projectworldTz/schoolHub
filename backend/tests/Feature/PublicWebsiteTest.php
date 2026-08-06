<?php

namespace Tests\Feature;

use App\Models\WebsiteFacility;
use App\Models\WebsitePageView;
use App\Models\WebsiteSection;
use App\Models\WebsiteSettings;
use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * The public one-page site — no auth at all, resolved by slug the same way
 * Public\NoticeBoardController is (see that class's doc comment). A school
 * 404s here unless BOTH website_enabled is 'active' AND
 * website_settings.is_published is true; see Public\WebsiteController.
 */
class PublicWebsiteTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function publishSite(\App\Models\School $school, array $settingsOverrides = []): WebsiteSettings
    {
        return WebsiteSettings::create(array_merge([
            'school_id' => $school->id,
            'is_published' => true,
        ], $settingsOverrides));
    }

    public function test_returns_404_when_website_access_was_never_granted(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => false]);
        $this->publishSite($school);

        $this->getJson("/api/public/site/{$school->slug}")->assertNotFound();
    }

    public function test_returns_404_when_granted_but_not_published(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        WebsiteSettings::create(['school_id' => $school->id, 'is_published' => false]);

        $this->getJson("/api/public/site/{$school->slug}")->assertNotFound();
    }

    public function test_returns_404_when_no_settings_row_exists_at_all(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);

        $this->getJson("/api/public/site/{$school->slug}")->assertNotFound();
    }

    public function test_returns_site_data_when_granted_and_published(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool([
            'website_enabled' => true,
            'website_activated_at' => now(),
            'name' => 'Sunrise Academy',
        ]);
        $this->publishSite($school, ['motto' => 'Rise and shine', 'theme_key' => 'luxury']);

        $response = $this->getJson("/api/public/site/{$school->slug}");

        $response->assertOk();
        $response->assertJsonPath('data.school.name', 'Sunrise Academy');
        $response->assertJsonPath('data.settings.motto', 'Rise and shine');
        $response->assertJsonPath('data.settings.theme_key', 'luxury');
    }

    public function test_hidden_sections_are_excluded_and_visible_ones_are_ordered(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($school);

        WebsiteSection::create(['school_id' => $school->id, 'section_key' => 'hero', 'is_visible' => true, 'sort_order' => 1]);
        WebsiteSection::create(['school_id' => $school->id, 'section_key' => 'about', 'is_visible' => false, 'sort_order' => 0]);
        WebsiteSection::create(['school_id' => $school->id, 'section_key' => 'contact', 'is_visible' => true, 'sort_order' => 0]);

        $response = $this->getJson("/api/public/site/{$school->slug}");

        $response->assertOk();
        $response->assertJsonPath('data.sections', ['contact', 'hero']);
    }

    public function test_two_schools_public_sites_never_cross_contaminate(): void
    {
        $this->seedPermissions();
        $schoolA = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $schoolB = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($schoolA, ['motto' => 'School A motto']);
        $this->publishSite($schoolB, ['motto' => 'School B motto']);

        WebsiteFacility::create(['school_id' => $schoolA->id, 'name' => 'Library A', 'sort_order' => 0]);
        WebsiteFacility::create(['school_id' => $schoolB->id, 'name' => 'Library B', 'sort_order' => 0]);

        $responseA = $this->getJson("/api/public/site/{$schoolA->slug}");
        $responseB = $this->getJson("/api/public/site/{$schoolB->slug}");

        $responseA->assertJsonPath('data.settings.motto', 'School A motto');
        $responseA->assertJsonPath('data.facilities.0.name', 'Library A');
        $responseB->assertJsonPath('data.settings.motto', 'School B motto');
        $responseB->assertJsonPath('data.facilities.0.name', 'Library B');
    }

    public function test_stats_are_hidden_when_stats_visibility_is_hide(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($school, ['stats_visibility' => 'hide']);

        $response = $this->getJson("/api/public/site/{$school->slug}");

        $response->assertOk();
        $response->assertJsonPath('data.stats', null);
    }

    /**
     * Functional coverage only — PHPUnit bypasses CSRF verification
     * entirely (Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::
     * runningUnitTests()), so this test cannot catch a regression of the
     * real bug this route once had: statefulApi() in bootstrap/app.php
     * applies Sanctum's session/CSRF middleware to every route in
     * routes/api.php based on request Origin, not on whether a session
     * exists, so an anonymous visitor's tracking beacon 419'd until
     * 'api/public/site/*' was added to validateCsrfTokens(except: ...).
     * That regression can only be caught by an actual browser request.
     */
    public function test_tracking_a_page_view_records_it_without_auth(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($school);

        $response = $this->postJson("/api/public/site/{$school->slug}/track", [
            'event_type' => 'section_view',
            'section_key' => 'hero',
        ]);

        $response->assertNoContent();
        // Tenant::runAsPlatform, not a bare query: BelongsToSchool's global
        // scope denies-by-default with no active tenant, and nothing in
        // this test method's own scope (as opposed to the request that
        // just completed) has one set.
        Tenant::runAsPlatform(function () use ($school) {
            $this->assertSame(1, WebsitePageView::where('school_id', $school->id)
                ->where('event_type', 'section_view')
                ->where('section_key', 'hero')
                ->count());
        });
    }

    public function test_tracking_silently_no_ops_for_a_school_without_website_access(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => false]);

        $response = $this->postJson("/api/public/site/{$school->slug}/track", [
            'event_type' => 'page_view',
        ]);

        $response->assertNoContent();
        Tenant::runAsPlatform(function () use ($school) {
            $this->assertSame(0, WebsitePageView::where('school_id', $school->id)->count());
        });
    }

    public function test_performance_insights_is_null_unless_stats_visibility_is_publish(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($school, ['stats_visibility' => 'summary_only']);

        $response = $this->getJson("/api/public/site/{$school->slug}");

        $response->assertOk();
        $response->assertJsonPath('data.performance_insights', null);
    }

    /**
     * The whole point of this endpoint: numbers on the marketing page must
     * be the school's actual exam data, not a placeholder. Verifies the
     * pass-rate trend, per-subject average, and grade breakdown all match
     * what was actually recorded — same math the internal analytics
     * dashboard uses (AnalyticsController::academics()).
     */
    public function test_performance_insights_reflects_real_exam_data_when_published(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 4);
        $fixture['school']->update(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($fixture['school'], ['stats_visibility' => 'publish']);

        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        [$s1, $s2, $s3, $s4] = $fixture['students'];
        // pass_marks is 40 (see createExamWithSubject) — s3 fails, the rest pass.
        $this->recordMark($fixture['school'], $examSubject, $s1, 90, 'A');
        $this->recordMark($fixture['school'], $examSubject, $s2, 70, 'B');
        $this->recordMark($fixture['school'], $examSubject, $s3, 30, 'F');
        $this->recordMark($fixture['school'], $examSubject, $s4, 85, 'A');

        $response = $this->getJson("/api/public/site/{$fixture['school']->slug}");

        $response->assertOk();
        $response->assertJsonPath('data.performance_insights.pass_rate_trend.0.label', $fixture['academicYear']->name);
        $response->assertJsonPath('data.performance_insights.pass_rate_trend.0.pass_rate', 75);
        $response->assertJsonPath('data.performance_insights.subject_performance.0.label', $fixture['subject']->name);
        $response->assertJsonPath('data.performance_insights.subject_performance.0.average_percentage', 68.8);

        $grades = collect($response->json('data.performance_insights.grade_distribution'))->keyBy('label');
        $this->assertSame(2, $grades['A']['count']);
        $this->assertSame(1, $grades['B']['count']);
        $this->assertSame(1, $grades['F']['count']);
    }

    public function test_performance_insights_excludes_results_from_unfinalized_exams(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        $fixture['school']->update(['website_enabled' => true, 'website_activated_at' => now()]);
        $this->publishSite($fixture['school'], ['stats_visibility' => 'publish']);

        ['examSubject' => $draftExamSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject'], status: 'draft'
        );
        [$s1, $s2] = $fixture['students'];
        $this->recordMark($fixture['school'], $draftExamSubject, $s1, 90, 'A');
        $this->recordMark($fixture['school'], $draftExamSubject, $s2, 20, 'F');

        $response = $this->getJson("/api/public/site/{$fixture['school']->slug}");

        $response->assertOk();
        $response->assertJsonPath('data.performance_insights.pass_rate_trend', []);
        $response->assertJsonPath('data.performance_insights.subject_performance', []);
        $response->assertJsonPath('data.performance_insights.grade_distribution', []);
    }
}
