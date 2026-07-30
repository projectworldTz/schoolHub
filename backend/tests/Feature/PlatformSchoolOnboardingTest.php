<?php

namespace Tests\Feature;

use App\Mail\AccountActivationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Registering a school used to only create the schools row — there was no
 * way for the owner to ever actually log in (SchoolUserController::store
 * derives school_id from the caller's own account, which doesn't exist yet
 * for a brand-new school). This covers the current flow: the Super Admin
 * provides the owner's name/email/phone in the same request that registers
 * the school, and the system emails the owner an activation link instead of
 * the Super Admin choosing/sharing a password directly (see
 * AccountActivationTest for redeeming that link).
 */
class PlatformSchoolOnboardingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_registering_a_school_creates_the_owner_and_emails_an_activation_link(): void
    {
        Mail::fake();
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

        $owner = User::withoutGlobalScopes()->where('email', 'amina@riverside.test')->firstOrFail();
        $this->assertTrue($owner->hasRole('School Owner'));
        $this->assertSame(
            $response->json('data.id'),
            $owner->school_id,
            'the owner must belong to the school just created, not the Super Admin\'s own school'
        );

        Mail::assertSent(AccountActivationMail::class, fn ($mail) => $mail->hasTo($owner->email));
    }

    public function test_the_new_owner_cannot_log_in_before_activating_their_account(): void
    {
        Mail::fake();
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

        $owner = User::withoutGlobalScopes()->where('email', 'amina@riverside.test')->firstOrFail();
        $this->assertFalse(Hash::check('password', $owner->password));

        // Nobody knows this password — it was randomly generated and never
        // communicated — so there is no password that logs this owner in
        // until they activate via the emailed link.
        $login = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/login', [
                'email' => 'amina@riverside.test',
                'password' => 'password',
            ]);
        $login->assertUnprocessable();
    }

    public function test_owner_email_must_be_unique_across_schools(): void
    {
        Mail::fake();
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
        Mail::fake();
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
