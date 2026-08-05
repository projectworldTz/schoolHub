<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Two independent gates on every Website Builder CMS route (see
 * App\Http\Middleware\EnsureWebsiteBuilderAccess): the website-builder.manage
 * permission (who on staff may touch it) and the school's website_enabled
 * premium grant (has the Platform Administrator actually turned the module
 * on). Both are enforced server-side, not just hidden in the frontend menu —
 * mirrors the AI Assistant's accessDenialResponse() defense-in-depth.
 */
class WebsiteBuilderPermissionTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_role_without_the_permission_is_blocked_even_with_website_access_granted(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->getJson('/api/school/website-builder/settings');

        $response->assertForbidden();
    }

    public function test_school_owner_is_blocked_when_website_access_was_never_granted(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => false, 'website_activated_at' => null]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/website-builder/settings');

        $response->assertForbidden();
    }

    public function test_school_owner_is_blocked_when_website_access_is_suspended(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool([
            'website_enabled' => true,
            'website_activated_at' => now()->subMonth(),
            'website_suspended_at' => now(),
            'website_suspension_reason' => 'Overdue invoice',
        ]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/website-builder/settings');

        $response->assertForbidden();
    }

    public function test_school_owner_with_permission_and_active_grant_can_reach_settings(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/website-builder/settings');

        $response->assertOk();
        $response->assertJsonPath('data.theme_key', 'modern');
    }

    public function test_settings_are_isolated_per_school(): void
    {
        $this->seedPermissions();
        $schoolA = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $schoolB = $this->createSchool(['website_enabled' => true, 'website_activated_at' => now()]);
        $ownerA = $this->createUser($schoolA, 'School Owner');
        $ownerB = $this->createUser($schoolB, 'School Owner');

        $this->actingAs($ownerA, 'web')->putJson('/api/school/website-builder/settings', ['motto' => 'School A motto'])->assertOk();
        $this->actingAs($ownerB, 'web')->putJson('/api/school/website-builder/settings', ['motto' => 'School B motto'])->assertOk();

        $this->actingAs($ownerA, 'web')->getJson('/api/school/website-builder/settings')
            ->assertJsonPath('data.motto', 'School A motto');
        $this->actingAs($ownerB, 'web')->getJson('/api/school/website-builder/settings')
            ->assertJsonPath('data.motto', 'School B motto');
    }
}
