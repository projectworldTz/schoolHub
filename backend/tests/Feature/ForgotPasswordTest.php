<?php

namespace Tests\Feature;

use App\Mail\PasswordResetMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_known_email_gets_a_reset_link_emailed(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'amina@riverside.test',
        ]);

        $response->assertOk();
        Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) {
            return $mail->user->email === 'amina@riverside.test' && $mail->token !== '';
        });
    }

    public function test_an_unknown_email_gets_the_same_response_and_no_mail(): void
    {
        Mail::fake();
        $this->seedPermissions();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nobody@riverside.test',
        ]);

        $response->assertOk();
        Mail::assertNothingSent();
    }

    public function test_the_emailed_token_can_be_redeemed_to_set_a_new_password_and_sign_in(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);
        $token = Password::broker()->createToken($owner);

        $response = $this->withHeader('Referer', 'http://localhost:5173')
            ->postJson('/api/auth/reset-password', [
                'email' => 'amina@riverside.test',
                'token' => $token,
                'password' => 'a-brand-new-password',
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.email', 'amina@riverside.test');

        $me = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/auth/me');
        $me->assertOk();
        $me->assertJsonPath('data.email', 'amina@riverside.test');
    }

    public function test_an_invalid_reset_token_is_rejected(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);
        Password::broker()->createToken($owner);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'amina@riverside.test',
            'token' => 'not-the-real-token',
            'password' => 'a-brand-new-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('token');
    }

    public function test_a_deactivated_account_cannot_complete_a_password_reset(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', [
            'email' => 'amina@riverside.test',
            'is_active' => false,
        ]);
        $token = Password::broker()->createToken($owner);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'amina@riverside.test',
            'token' => $token,
            'password' => 'a-brand-new-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }
}
