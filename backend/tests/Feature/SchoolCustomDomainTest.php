<?php

namespace Tests\Feature;

use App\Http\Middleware\ResolveTenantFromUser;
use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the custom-domains groundwork: setting/clearing a domain is
 * Super-Admin-only and validated; an unauthenticated request only resolves
 * a tenant from its Host header when a school actually has that domain
 * configured (every existing school has none, so this must never activate
 * on its own); and an authenticated user's own school always wins over
 * whatever domain the request came in on.
 */
class SchoolCustomDomainTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_super_admin_can_set_a_schools_custom_domain(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool();

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$school->id}/custom-domain", ['custom_domain' => 'https://My-School.co.tz/']);

        $response->assertOk();
        // A pasted full URL is normalized down to a bare lowercase hostname.
        $this->assertSame('my-school.co.tz', $response->json('data.custom_domain'));
    }

    public function test_a_super_admin_can_clear_a_schools_custom_domain(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool(['custom_domain' => 'my-school.co.tz']);

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$school->id}/custom-domain", ['custom_domain' => null]);

        $response->assertOk();
        $this->assertNull($response->json('data.custom_domain'));
    }

    public function test_two_schools_cannot_share_the_same_custom_domain(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $this->createSchool(['custom_domain' => 'taken.co.tz']);
        $schoolB = $this->createSchool();

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$schoolB->id}/custom-domain", ['custom_domain' => 'taken.co.tz']);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('custom_domain');
    }

    public function test_a_non_super_admin_cannot_set_a_custom_domain(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')
            ->postJson("/api/platform/schools/{$school->id}/custom-domain", ['custom_domain' => 'my-school.co.tz']);

        $response->assertForbidden();
    }

    public function test_an_unauthenticated_request_resolves_the_tenant_from_a_configured_custom_domain(): void
    {
        $school = $this->createSchool(['custom_domain' => 'my-school.co.tz']);

        $request = Request::create('http://my-school.co.tz/api/anything', 'GET');

        $middleware = new ResolveTenantFromUser;
        $middleware->handle($request, function () use ($school) {
            $this->assertSame($school->id, Tenant::id());

            return response('ok');
        });
    }

    public function test_an_unauthenticated_request_to_an_unconfigured_domain_never_resolves_a_tenant(): void
    {
        // No school has a custom_domain at all — this is the state of every
        // real school today, and must remain a complete no-op.
        $this->createSchool();

        $request = Request::create('http://schoolhub.projectworldtz.com/api/anything', 'GET');

        $middleware = new ResolveTenantFromUser;
        $middleware->handle($request, function () {
            $this->assertNull(Tenant::id());

            return response('ok');
        });
    }

    public function test_an_authenticated_users_own_school_always_wins_over_the_request_domain(): void
    {
        $this->seedPermissions();
        $ownSchool = $this->createSchool();
        $otherSchool = $this->createSchool(['custom_domain' => 'other-school.co.tz']);
        $user = $this->createUser($ownSchool, 'School Owner');

        // Hitting a route the user is genuinely authorized for is enough to
        // prove tenant resolution — school-profile is scoped to the caller's
        // own school regardless of which domain the request arrived on.
        $response = $this->actingAs($user, 'web')
            ->withServerVariables(['HTTP_HOST' => 'other-school.co.tz'])
            ->getJson('/api/school/profile');

        $response->assertOk();
        $response->assertJsonPath('data.id', $ownSchool->id);
        $this->assertNotSame($otherSchool->id, $response->json('data.id'));
    }
}
