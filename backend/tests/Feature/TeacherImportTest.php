<?php

namespace Tests\Feature;

use App\Mail\AccountActivationMail;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class TeacherImportTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('teachers.csv', $content);
    }

    public function test_a_dry_run_reports_rows_but_persists_nothing(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role\nGrace Mwakalinga,grace@example.com,Class Teacher\n"),
            'dry_run' => 'true',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.committed', false);
        $response->assertJsonPath('data.rows.0.status', 'would_create');
        $this->assertSame(0, User::withoutGlobalScopes()->where('email', 'grace@example.com')->count());
        Mail::assertNothingSent();
    }

    public function test_committing_creates_a_working_login_role_and_staff_profile_and_sends_activation_mail(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role,phone,staff_number\nGrace Mwakalinga,grace@example.com,Class Teacher,+255700000001,STF-100\n"),
            'dry_run' => 'false',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.created_count', 1);

        $teacher = User::withoutGlobalScopes()->where('email', 'grace@example.com')->firstOrFail();
        $this->assertTrue($teacher->hasRole('Class Teacher'));
        $this->assertSame($school->id, $teacher->school_id);
        $this->assertSame('+255700000001', $teacher->phone);

        $profile = StaffProfile::where('user_id', $teacher->id)->firstOrFail();
        $this->assertSame('STF-100', $profile->staff_number);

        Mail::assertSent(AccountActivationMail::class, fn ($mail) => $mail->hasTo($teacher->email));
    }

    public function test_a_blank_staff_number_is_auto_generated(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role\nGrace Mwakalinga,grace@example.com,Class Teacher\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $teacher = User::withoutGlobalScopes()->where('email', 'grace@example.com')->firstOrFail();
        $this->assertNotNull(StaffProfile::where('user_id', $teacher->id)->first()->staff_number);
    }

    public function test_an_email_that_already_exists_is_rejected(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner', ['email' => 'grace@example.com']);

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role\nGrace Mwakalinga,grace@example.com,Class Teacher\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.error_count', 1);
        $response->assertJsonPath('data.rows.0.errors.0', "Email 'grace@example.com' already exists.");
    }

    public function test_a_role_not_offered_to_this_school_type_is_rejected(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        // 'Lecturer' is a college/university-only role, not available to a primary school.
        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role\nGrace Mwakalinga,grace@example.com,Lecturer\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.error_count', 1);
        $this->assertSame(0, User::withoutGlobalScopes()->where('email', 'grace@example.com')->count());
    }

    public function test_a_recognized_class_assigned_attaches_the_teacher_to_that_class(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $fixture['school']->update(['type' => 'primary']);

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role,class_assigned\nGrace Mwakalinga,grace@example.com,Class Teacher,{$fixture['schoolClass']->name}\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $response->assertJsonPath('data.rows.0.warnings', []);
        $teacher = User::withoutGlobalScopes()->where('email', 'grace@example.com')->firstOrFail();
        $this->assertTrue($teacher->assignedClasses()->where('school_classes.id', $fixture['schoolClass']->id)->exists());
    }

    public function test_an_unrecognized_class_assigned_still_creates_the_teacher_with_a_warning(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role,class_assigned\nGrace Mwakalinga,grace@example.com,Class Teacher,Nonexistent\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $this->assertNotEmpty($response->json('data.rows.0.warnings'));
    }

    public function test_a_file_missing_required_headers_is_rejected_up_front(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("name,age\nGrace,30\n"),
            'dry_run' => 'true',
        ]);

        $response->assertOk();
        $missing = $response->json('data.missing_headers');
        $this->assertContains('full_name', $missing);
        $this->assertContains('email', $missing);
        $this->assertContains('role', $missing);
    }

    public function test_a_user_without_staff_manage_cannot_import(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['type' => 'primary']);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->post('/api/school/staff/import', [
            'file' => $this->csv("full_name,email,role\nGrace Mwakalinga,grace@example.com,Class Teacher\n"),
            'dry_run' => 'true',
        ]);

        $response->assertForbidden();
    }
}
