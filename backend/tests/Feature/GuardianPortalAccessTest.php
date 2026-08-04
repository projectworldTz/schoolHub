<?php

namespace Tests\Feature;

use App\Mail\AccountActivationMail;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards GuardianPortalController@store — granting a guardian a Parent
 * Portal login must both email an activation link AND hand the admin a
 * working temporary password directly, so they can verify access
 * themselves without depending on (or waiting for) mail delivery.
 */
class GuardianPortalAccessTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function makeGuardian(\App\Models\School $school): Guardian
    {
        $student = Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-1',
            'first_name' => 'Test',
            'last_name' => 'Student',
            'status' => 'active',
        ]);

        $guardian = Guardian::create([
            'school_id' => $school->id,
            'name' => 'Hassan Ali',
        ]);

        $student->guardians()->attach($guardian->id, ['relationship' => 'Father', 'is_primary' => true]);

        return $guardian;
    }

    public function test_granting_access_creates_a_parent_account_and_emails_an_activation_link(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $guardian = $this->makeGuardian($school);

        $response = $this->actingAs($owner, 'web')->postJson(
            "/api/school/guardians/{$guardian->id}/portal-access",
            ['email' => 'hassan@example.com']
        );

        $response->assertOk();
        $response->assertJsonPath('data.email', 'hassan@example.com');
        $this->assertNotEmpty($response->json('data.temporary_password'));

        $guardian->refresh();
        $this->assertNotNull($guardian->user_id);

        $portalUser = User::withoutGlobalScopes()->find($guardian->user_id);
        $this->assertTrue($portalUser->hasRole('Parent'));

        Mail::assertSent(AccountActivationMail::class, fn ($mail) => $mail->hasTo('hassan@example.com'));
    }

    public function test_the_returned_temporary_password_actually_logs_the_parent_in(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $guardian = $this->makeGuardian($school);

        $granted = $this->actingAs($owner, 'web')->postJson(
            "/api/school/guardians/{$guardian->id}/portal-access",
            ['email' => 'hassan@example.com']
        );
        $temporaryPassword = $granted->json('data.temporary_password');

        $login = $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/auth/login', [
            'email' => 'hassan@example.com',
            'password' => $temporaryPassword,
        ]);

        $login->assertOk();
        $login->assertJsonPath('data.must_change_password', true);
    }

    public function test_a_guardian_who_already_has_access_cannot_be_granted_it_again(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $guardian = $this->makeGuardian($school);

        $this->actingAs($owner, 'web')->postJson(
            "/api/school/guardians/{$guardian->id}/portal-access",
            ['email' => 'hassan@example.com']
        )->assertOk();

        $response = $this->actingAs($owner, 'web')->postJson(
            "/api/school/guardians/{$guardian->id}/portal-access",
            ['email' => 'someone-else@example.com']
        );

        $response->assertUnprocessable();
    }

    public function test_a_user_without_students_manage_cannot_grant_access(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');
        $guardian = $this->makeGuardian($school);

        $response = $this->actingAs($teacher, 'web')->postJson(
            "/api/school/guardians/{$guardian->id}/portal-access",
            ['email' => 'hassan@example.com']
        );

        $response->assertForbidden();
    }
}
