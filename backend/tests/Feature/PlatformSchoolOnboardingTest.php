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
 * for a brand-new school). This covers the fix: the Super Admin now
 * provides the owner's credentials in the same request that registers the
 * school.
 */
class PlatformSchoolOnboardingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_registering_a_school_creates_a_working_login_for_its_owner(): void
    {
        $this->seedPermissions();

        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $response = $this->actingAs($superAdmin, 'web')->postJson('/api/platform/schools', [
            'name' => 'Riverside Academy',
            'slug' => 'riverside-academy',
            'type' => 'secondary',
            'owner_name' => 'Amina Owner',
            'owner_email' => 'amina@riverside.test',
            'owner_password' => 'correct-horse-battery',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.owner.name', 'Amina Owner');
        $response->assertJsonPath('data.owner.email', 'amina@riverside.test');

        $owner = User::withoutGlobalScopes()->where('email', 'amina@riverside.test')->firstOrFail();
        $this->assertTrue($owner->hasRole('School Owner'));
        $this->assertTrue(Hash::check('correct-horse-battery', $owner->password));
        $this->assertSame(
            $response->json('data.id'),
            $owner->school_id,
            'the owner must belong to the school just created, not the Super Admin\'s own school'
        );

        // The whole point: that owner can now actually sign in. A Referer
        // matching SANCTUM_STATEFUL_DOMAINS is required so Sanctum treats
        // this as a first-party SPA request and starts a session — exactly
        // what a real browser request from the frontend does.
        $login = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/login', [
                'email' => 'amina@riverside.test',
                'password' => 'correct-horse-battery',
            ]);
        $login->assertOk();
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
            'owner_name' => 'Someone Else',
            'owner_email' => 'taken@example.com',
            'owner_password' => 'correct-horse-battery',
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
            'owner_password' => 'correct-horse-battery',
        ]);

        $response->assertForbidden();
    }
}
