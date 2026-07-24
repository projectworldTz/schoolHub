<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the license-expiry feature: the Super Admin must pick a duration
 * (1/3/6/12 months) when registering a school, which becomes
 * license_expires_at; and renewing a school's license always extends from
 * today, not from whatever the old expiry date was (so a lapsed school
 * doesn't stay "expired" after being renewed).
 */
class SchoolLicenseTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy',
            'type' => 'secondary',
            'license_duration_months' => 3,
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina@riverside.test',
            'owner_password' => 'correct-horse-battery',
        ], $overrides);
    }

    public function test_registering_a_school_requires_a_license_duration(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $payload = $this->payload();
        unset($payload['license_duration_months']);

        $response = $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('license_duration_months');
    }

    public function test_registering_a_school_rejects_an_unsupported_duration(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson('/api/platform/schools', $this->payload(['license_duration_months' => 2]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('license_duration_months');
    }

    public function test_registering_a_school_computes_license_expiry_from_the_chosen_duration(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        Carbon::setTestNow('2026-01-01 00:00:00');

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson('/api/platform/schools', $this->payload(['license_duration_months' => 6]));

        $response->assertCreated();
        $this->assertSame('2026-07-01T00:00:00.000000Z', $response->json('data.license_expires_at'));

        Carbon::setTestNow();
    }

    public function test_a_super_admin_can_renew_a_schools_license(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool(['license_expires_at' => now()->subDays(10)]);

        Carbon::setTestNow('2026-03-01 00:00:00');

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$school->id}/renew-license", ['months' => 12]);

        $response->assertOk();
        $this->assertSame('2027-03-01T00:00:00.000000Z', $response->json('data.license_expires_at'));

        Carbon::setTestNow();
    }

    public function test_renewing_rejects_an_unsupported_duration(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool();

        $response = $this->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$school->id}/renew-license", ['months' => 24]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('months');
    }

    public function test_a_non_super_admin_cannot_renew_a_license(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')
            ->postJson("/api/platform/schools/{$school->id}/renew-license", ['months' => 12]);

        $response->assertForbidden();
    }
}
