<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Redeeming the activation link a new School Owner is emailed (see
 * App\Services\Platform\SchoolService::create() and
 * AuthController::activate()) — reuses Laravel's password-reset token
 * broker rather than a bespoke token column, so this also guards that the
 * cross-tenant lookup (the owner's school_id isn't known until the broker
 * resolves them by email) doesn't get lost in a future refactor.
 */
class AccountActivationTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_valid_token_activates_the_account_and_signs_the_owner_in(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);
        $token = Password::broker()->createToken($owner);

        // A Referer matching SANCTUM_STATEFUL_DOMAINS is required so Sanctum
        // treats this as a first-party SPA request and starts a session —
        // same as the login test (AuthController::login).
        $response = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/activate-account', [
                'email' => 'amina@riverside.test',
                'token' => $token,
                'password' => 'a-brand-new-password',
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.email', 'amina@riverside.test');

        // The activation itself establishes the session.
        $me = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/auth/me');
        $me->assertOk();
        $me->assertJsonPath('data.email', 'amina@riverside.test');
    }

    public function test_an_invalid_token_is_rejected(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);
        Password::broker()->createToken($owner);

        $response = $this->postJson('/api/auth/activate-account', [
            'email' => 'amina@riverside.test',
            'token' => 'not-the-real-token',
            'password' => 'a-brand-new-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('token');
    }

    public function test_an_expired_token_is_rejected(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);
        $token = Password::broker()->createToken($owner);

        // 24h expiry (config/auth.php passwords.users.expire) — see that
        // file's comment for why this token type lives longer than
        // Laravel's 60-minute default.
        $this->travel(25)->hours();

        $response = $this->postJson('/api/auth/activate-account', [
            'email' => 'amina@riverside.test',
            'token' => $token,
            'password' => 'a-brand-new-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('token');
    }

    public function test_an_unknown_email_is_rejected(): void
    {
        $this->seedPermissions();

        $response = $this->postJson('/api/auth/activate-account', [
            'email' => 'nobody@riverside.test',
            'token' => 'whatever',
            'password' => 'a-brand-new-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('token');
    }
}
