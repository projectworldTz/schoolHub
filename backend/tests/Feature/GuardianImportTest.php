<?php

namespace Tests\Feature;

use App\Mail\AccountActivationMail;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class GuardianImportTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('guardians.csv', $content);
    }

    protected function makeStudent(\App\Models\School $school, string $admissionNumber): Student
    {
        return Student::create([
            'school_id' => $school->id,
            'admission_number' => $admissionNumber,
            'first_name' => 'Test',
            'last_name' => 'Student',
            'status' => 'active',
        ]);
    }

    public function test_a_dry_run_reports_rows_but_persists_nothing(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->makeStudent($school, 'ADM-1');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship\nADM-1,Hassan Ali,Father\n"),
            'dry_run' => 'true',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.committed', false);
        $response->assertJsonPath('data.rows.0.status', 'would_create');
        $this->assertSame(0, Guardian::count());
        Mail::assertNothingSent();
    }

    public function test_committing_creates_a_guardian_and_links_it_to_the_student(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $student = $this->makeStudent($school, 'ADM-1');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship,is_primary\nADM-1,Hassan Ali,Father,yes\n"),
            'dry_run' => 'false',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.created_count', 1);
        $this->assertSame(1, Guardian::count());

        $student->refresh();
        $this->assertSame('Hassan Ali', $student->guardians->first()->name);
        $this->assertSame('Father', $student->guardians->first()->pivot->relationship);
        $this->assertTrue((bool) $student->guardians->first()->pivot->is_primary);
    }

    public function test_a_second_row_with_the_same_email_reuses_the_guardian_instead_of_duplicating(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->makeStudent($school, 'ADM-1');
        $this->makeStudent($school, 'ADM-2');

        $csv = "student_admission_number,guardian_name,relationship,email\n"
            ."ADM-1,Hassan Ali,Father,hassan@example.com\n"
            ."ADM-2,Hassan Ali,Father,hassan@example.com\n";

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv($csv),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 2);
        $this->assertSame(1, Guardian::count(), 'both rows should link to the same guardian, not create two');

        $guardian = Guardian::first();
        $this->assertSame(2, $guardian->students()->count());
    }

    public function test_an_email_creates_parent_portal_access_and_sends_activation_mail(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->makeStudent($school, 'ADM-1');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship,email\nADM-1,Hassan Ali,Father,hassan@example.com\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $guardian = Guardian::first();
        $this->assertNotNull($guardian->user_id);

        $portalUser = User::withoutGlobalScopes()->find($guardian->user_id);
        $this->assertTrue($portalUser->hasRole('Parent'));

        Mail::assertSent(AccountActivationMail::class, fn ($mail) => $mail->hasTo('hassan@example.com'));
    }

    public function test_no_email_means_no_portal_account(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->makeStudent($school, 'ADM-1');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship\nADM-1,Hassan Ali,Father\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $this->assertNull(Guardian::first()->user_id);
        Mail::assertNothingSent();
    }

    public function test_an_email_already_used_by_another_account_skips_portal_access_with_a_warning(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner', ['email' => 'hassan@example.com']);
        $this->makeStudent($school, 'ADM-1');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship,email\nADM-1,Hassan Ali,Father,hassan@example.com\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $this->assertNull(Guardian::first()->user_id);
        $this->assertNotEmpty($response->json('data.rows.0.warnings'));
        Mail::assertNothingSent();
    }

    public function test_an_unknown_admission_number_is_rejected(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship\nADM-404,Hassan Ali,Father\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.error_count', 1);
        $this->assertSame(0, Guardian::count());
    }

    public function test_a_file_missing_required_headers_is_rejected_up_front(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("name,age\nHassan,40\n"),
            'dry_run' => 'true',
        ]);

        $response->assertOk();
        $missing = $response->json('data.missing_headers');
        $this->assertContains('student_admission_number', $missing);
        $this->assertContains('guardian_name', $missing);
        $this->assertContains('relationship', $missing);
    }

    public function test_a_user_without_students_manage_cannot_import(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->post('/api/school/guardians/import', [
            'file' => $this->csv("student_admission_number,guardian_name,relationship\nADM-1,Hassan Ali,Father\n"),
            'dry_run' => 'true',
        ]);

        $response->assertForbidden();
    }
}
