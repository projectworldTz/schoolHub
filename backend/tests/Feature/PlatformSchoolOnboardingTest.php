<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Registering a school used to only create the schools row — there was no
 * way for the owner to ever actually log in (SchoolUserController::store
 * derives school_id from the caller's own account, which doesn't exist yet
 * for a brand-new school). This covers the current flow: the Super Admin
 * provides the owner's name/email/phone in the same request that registers
 * the school, and the system generates a temporary password shown once in
 * the response (for the Super Admin to relay directly) rather than emailing
 * anything — the owner logs in with it and is forced to change it before
 * doing anything else (see EnsurePasswordHasBeenChanged and
 * AuthController::changePassword).
 */
class PlatformSchoolOnboardingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_registering_a_school_creates_the_owner_with_a_one_time_temporary_password(): void
    {
        $this->seedPermissions();

        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $response = $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', [
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy',
            'type' => 'secondary',
            'license_duration_months' => 12,
            'subscription_plan' => 'Standard',
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina@riverside.test',
            'owner_phone' => '+255700000000',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.owner.name', 'Amina Owner');
        $response->assertJsonPath('data.owner.email', 'amina@riverside.test');
        $temporaryPassword = $response->json('data.owner.temporary_password');
        $this->assertNotEmpty($temporaryPassword);

        $owner = User::withoutGlobalScopes()->where('email', 'amina@riverside.test')->firstOrFail();
        $this->assertTrue($owner->hasRole('School Owner'));
        $this->assertTrue($owner->must_change_password);
        $this->assertTrue(Hash::check($temporaryPassword, $owner->password));
        $this->assertSame(
            $response->json('data.id'),
            $owner->school_id,
            'the owner must belong to the school just created, not the Super Admin\'s own school'
        );
    }

    public function test_a_school_list_response_never_leaks_the_temporary_password(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', [
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy',
            'type' => 'secondary',
            'license_duration_months' => 12,
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina@riverside.test',
        ]);

        $index = $this->actingAs($superAdmin, 'web')->getJson('/api/platform/schools');

        $index->assertOk();
        $school = collect($index->json('data'))->firstWhere('name', 'Riverside Academy');
        $this->assertArrayHasKey('temporary_password', $school['owner']);
        $this->assertNull($school['owner']['temporary_password']);
    }

    public function test_the_owner_can_log_in_with_the_temporary_password_but_must_change_it_first(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $create = $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', [
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy',
            'type' => 'secondary',
            'license_duration_months' => 12,
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina@riverside.test',
        ]);
        $temporaryPassword = $create->json('data.owner.temporary_password');

        $login = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/login', [
                'email' => 'amina@riverside.test',
                'password' => $temporaryPassword,
            ]);
        $login->assertOk();
        $login->assertJsonPath('data.must_change_password', true);

        // Blocked from the rest of the app until they change it...
        $blocked = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/school/profile');
        $blocked->assertStatus(423);

        // ...but changing it unblocks everything, immediately, same session.
        $change = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/change-password', ['password' => 'a-brand-new-password']);
        $change->assertOk();
        $change->assertJsonPath('data.must_change_password', false);

        $unblocked = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/school/profile');
        $unblocked->assertOk();
    }

    public function test_a_wrong_temporary_password_is_rejected(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', [
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy',
            'type' => 'secondary',
            'license_duration_months' => 12,
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina@riverside.test',
        ]);

        $login = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/login', [
                'email' => 'amina@riverside.test',
                'password' => 'definitely-not-it',
            ]);
        $login->assertUnprocessable();
    }

    public function test_owner_email_must_be_unique_across_schools(): void
    {
        $this->seedPermissions();

        $this->createUser($this->createSchool(), 'School Owner', ['email' => 'taken@example.com']);
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $response = $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', [
            'name' => 'Another School',
            'slug' => 'another-school',
            'type' => 'primary',
            'license_duration_months' => 12,
            'owner_name' => 'Someone Else',
            'owner_email' => 'taken@example.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('owner_email');
    }

    public function test_a_non_super_admin_cannot_register_a_school(): void
    {
        $this->seedPermissions();

        $owner = $this->createUser($this->createSchool(), 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/platform/schools', [
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy-2',
            'type' => 'secondary',
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina2@riverside.test',
        ]);

        $response->assertForbidden();
    }
}
