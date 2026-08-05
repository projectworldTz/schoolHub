<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Website Builder is a premium, per-school feature (App\Models\School's
 * website_* columns, App\Services\WebsiteBuilder\WebsitePremiumAccessService)
 * granted/revoked by the Platform Admin — same lifecycle shape as
 * AiPremiumAccessTest, deliberately mirrored since the module was built to
 * copy that architecture exactly.
 */
class WebsiteAccessGrantTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_new_school_has_no_website_access_by_default(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();

        $this->assertSame('not_granted', $school->websiteAccessStatus());
    }

    public function test_a_super_admin_can_grant_website_access(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool();

        $response = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/website-access/grant");

        $response->assertOk();
        $response->assertJsonPath('data.website_access_status', 'active');
        $this->assertSame($superAdmin->id, $school->fresh()->website_access_updated_by);
    }

    public function test_a_non_super_admin_cannot_grant_website_access(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson("/api/platform/schools/{$school->id}/website-access/grant");

        $response->assertForbidden();
    }

    public function test_a_super_admin_can_suspend_reactivate_and_revoke_website_access(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);

        $suspend = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/website-access/suspend", [
            'reason' => 'Payment overdue',
        ]);
        $suspend->assertOk()->assertJsonPath('data.website_access_status', 'suspended');

        $reactivate = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/website-access/reactivate");
        $reactivate->assertOk()->assertJsonPath('data.website_access_status', 'active');

        $revoke = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/website-access/revoke");
        $revoke->assertOk()->assertJsonPath('data.website_access_status', 'not_granted');
    }

    public function test_granting_website_access_never_touches_ai_access(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool(['ai_enabled' => false, 'ai_activated_at' => null]);

        $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/website-access/grant")->assertOk();

        $school->refresh();
        $this->assertSame('active', $school->websiteAccessStatus());
        $this->assertSame('not_granted', $school->aiAccessStatus());
    }
}
