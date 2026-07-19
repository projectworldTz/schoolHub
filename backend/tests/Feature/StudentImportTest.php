<?php

namespace Tests\Feature;

use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class StudentImportTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('students.csv', $content);
    }

    public function test_a_dry_run_reports_rows_but_persists_nothing(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name\nADM-1,Amina,Hassan\n"),
            'dry_run' => 'true',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.committed', false);
        $response->assertJsonPath('data.rows.0.status', 'would_create');
        $this->assertSame(0, Student::count());
    }

    public function test_committing_creates_valid_rows_and_skips_invalid_ones(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $csv = "admission_number,first_name,last_name\n"
            ."ADM-1,Amina,Hassan\n"
            .",Missing,AdmissionNumber\n";

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv($csv),
            'dry_run' => 'false',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.committed', true);
        $response->assertJsonPath('data.created_count', 1);
        $response->assertJsonPath('data.error_count', 1);
        $this->assertSame(1, Student::count());
        $this->assertSame('Amina', Student::first()->first_name);
    }

    public function test_a_duplicate_admission_number_within_the_same_file_is_rejected(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $csv = "admission_number,first_name,last_name\n"
            ."ADM-1,First,Student\n"
            ."ADM-1,Second,Student\n";

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv($csv),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $response->assertJsonPath('data.rows.1.errors.0', "Duplicate admission number 'ADM-1' earlier in this file.");
        $this->assertSame(1, Student::count());
    }

    public function test_an_admission_number_that_already_exists_in_the_school_is_rejected(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-1',
            'first_name' => 'Existing',
            'last_name' => 'Student',
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name\nADM-1,New,Student\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.error_count', 1);
        $response->assertJsonPath('data.rows.0.errors.0', "Admission number 'ADM-1' already exists.");
        $this->assertSame(1, Student::count());
    }

    public function test_a_second_schools_admission_numbers_do_not_collide_with_the_first(): void
    {
        $this->seedPermissions();
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        Student::create([
            'school_id' => $schoolA->id,
            'admission_number' => 'ADM-1',
            'first_name' => 'SchoolA',
            'last_name' => 'Student',
            'status' => 'active',
        ]);
        $ownerB = $this->createUser($schoolB, 'School Owner');

        // Same admission number, different (tenant-scoped) school — must be allowed.
        $response = $this->actingAs($ownerB, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name\nADM-1,SchoolB,Student\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
    }

    public function test_a_recognized_class_name_creates_an_active_enrollment(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Amina,Hassan,Form 1\n"),
            'dry_run' => 'false',
        ]);

        $studentId = $response->json('data.rows.0.student_id');
        $student = Student::with('currentEnrollment.schoolClass')->find($studentId);
        $this->assertSame('Form 1', $student->currentEnrollment?->schoolClass?->name);
    }

    public function test_class_name_matching_is_case_insensitive(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Amina,Hassan,FORM 1\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.rows.0.warnings', []);
        $response->assertJsonPath('data.created_count', 1);
    }

    public function test_an_unrecognized_class_name_still_creates_the_student_with_a_warning(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Amina,Hassan,Nonexistent\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 1);
        $this->assertNotEmpty($response->json('data.rows.0.warnings'));
        $studentId = $response->json('data.rows.0.student_id');
        $this->assertNull(Student::find($studentId)->currentEnrollment);
    }

    public function test_a_file_missing_required_headers_is_rejected_up_front(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("name,age\nAmina,12\n"),
            'dry_run' => 'true',
        ]);

        $response->assertOk();
        $missing = $response->json('data.missing_headers');
        $this->assertContains('admission_number', $missing);
        $this->assertContains('first_name', $missing);
        $this->assertContains('last_name', $missing);
    }

    public function test_blank_lines_are_skipped_without_being_reported_as_errors(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $csv = "admission_number,first_name,last_name\nADM-1,Amina,Hassan\n\n\nADM-2,Bakari,Juma\n";

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv($csv),
            'dry_run' => 'true',
        ]);

        $response->assertJsonPath('data.total_rows', 2);
    }

    public function test_a_teacher_without_students_manage_cannot_import(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name\nADM-1,Amina,Hassan\n"),
            'dry_run' => 'true',
        ]);

        $response->assertForbidden();
    }
}
