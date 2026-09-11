<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class GoogleSignInTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_existing_active_user_can_link_verified_google_account_and_sign_in(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $user = $this->createUser($school, 'School Owner', ['email' => 'owner@example.com']);
        $this->mockGoogleUser('google-123', 'OWNER@example.com', true);

        $this->get('/auth/google/callback')->assertRedirect('http://localhost:5173/');

        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'google_id' => 'google-123']);
    }

    public function test_unknown_google_email_is_not_registered_or_authenticated(): void
    {
        $this->mockGoogleUser('google-unknown', 'unknown@example.com', true);

        $this->get('/auth/google/callback')->assertRedirect('http://localhost:5173/login?google_error=account');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'unknown@example.com']);
    }

    public function test_unverified_google_email_is_rejected(): void
    {
        $this->mockGoogleUser('google-unverified', 'person@example.com', false);

        $this->get('/auth/google/callback')->assertRedirect('http://localhost:5173/login?google_error=unverified');
        $this->assertGuest();
    }

    public function test_deactivated_user_cannot_sign_in_with_google(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createUser($school, 'School Owner', ['email' => 'inactive@example.com', 'is_active' => false]);
        $this->mockGoogleUser('google-inactive', 'inactive@example.com', true);

        $this->get('/auth/google/callback')->assertRedirect('http://localhost:5173/login?google_error=account');
        $this->assertGuest();
    }

    private function mockGoogleUser(string $id, string $email, bool $verified): void
    {
        $googleUser = (new GoogleUser)->setRaw(['verified_email' => $verified])->map([
            'id' => $id,
            'email' => $email,
            'name' => 'Google User',
        ]);
        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);
    }
}
