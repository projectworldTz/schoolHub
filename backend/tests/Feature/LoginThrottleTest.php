<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Login is the main password-guessing surface for the whole app — this
 * covers the 'login' rate limiter added alongside it (AppServiceProvider).
 */
class LoginThrottleTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_repeated_failed_logins_for_the_same_account_get_throttled(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'email' => 'amina@riverside.test',
                'password' => 'wrong-password',
            ]);
            $response->assertStatus(422);
        }

        $sixth = $this->postJson('/api/auth/login', [
            'email' => 'amina@riverside.test',
            'password' => 'wrong-password',
        ]);
        $sixth->assertStatus(429);
    }

    public function test_a_different_account_from_the_same_ip_is_not_caught_by_someone_elses_throttling(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createUser($school, 'School Owner', ['email' => 'victim1@riverside.test']);
        $this->createUser($school, 'School Owner', ['email' => 'victim2@riverside.test']);

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'victim1@riverside.test',
                'password' => 'wrong-password',
            ]);
        }

        // victim1 is now locked out from the same "IP" (the test client's
        // default), but victim2 signing in from that same shared
        // network/IP must be unaffected.
        $response = $this->postJson('/api/auth/login', [
            'email' => 'victim2@riverside.test',
            'password' => 'wrong-password',
        ]);
        $response->assertStatus(422);
    }
}
