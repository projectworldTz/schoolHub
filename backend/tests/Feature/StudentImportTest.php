<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
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

    /**
     * Pre-Unit/Nursery span 2 years each, Standard 1-7 span 1 year each —
     * the exact progression from the product spec, expressed only as
     * per-class durations (never a calendar year), so the offsets it
     * produces are: Pre-Unit 0, Nursery 2, Standard 1 4, Standard 2 5, ...
     * Standard 7 10.
     */
    protected function createStandardProgression(string $schoolId): void
    {
        SchoolClass::create(['school_id' => $schoolId, 'name' => 'Pre-Unit', 'level' => 0, 'duration_years' => 2]);
        SchoolClass::create(['school_id' => $schoolId, 'name' => 'Nursery', 'level' => 1, 'duration_years' => 2]);
        foreach (range(1, 7) as $i) {
            SchoolClass::create(['school_id' => $schoolId, 'name' => "Standard {$i}", 'level' => 1 + $i]);
        }
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

    public function test_an_existing_admission_number_updates_the_student_instead_of_erroring(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $student = Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-1',
            'first_name' => 'Old',
            'last_name' => 'Name',
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name\nADM-1,New,Student\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.created_count', 0);
        $response->assertJsonPath('data.updated_count', 1);
        $response->assertJsonPath('data.rows.0.status', 'updated');
        $this->assertSame(1, Student::count());
        $student->refresh();
        $this->assertSame('New', $student->first_name);
        $this->assertSame('Student', $student->last_name);
    }

    public function test_a_blank_cell_on_update_does_not_erase_an_existing_value(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-1',
            'first_name' => 'Existing',
            'last_name' => 'Student',
            'gender' => 'female',
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,gender\nADM-1,Existing,Student,\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.updated_count', 1);
        $this->assertSame('female', Student::first()->gender);
    }

    public function test_reimporting_a_students_new_class_updates_the_existing_enrollment_instead_of_duplicating(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        SchoolClass::create(['school_id' => $fixture['school']->id, 'name' => 'Form 2', 'level' => 2]);

        $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Amina,Hassan,Form 1\n"),
            'dry_run' => 'false',
        ]);

        $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Amina,Hassan,Form 2\n"),
            'dry_run' => 'false',
        ]);

        $student = Student::where('admission_number', 'ADM-1')->first();
        $this->assertSame(1, $student->enrollments()->where('status', 'active')->count());
        $student->load('currentEnrollment.schoolClass');
        $this->assertSame('Form 2', $student->currentEnrollment?->schoolClass?->name);
    }

    public function test_enrollment_year_is_calculated_from_cumulative_class_durations(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2026/2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);
        $this->createStandardProgression($school->id);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Juma,Kimaro,Standard 7\n"),
            'dry_run' => 'false',
        ]);

        // offset(Standard 7) = Pre-Unit(2) + Nursery(2) + Standard 1..6(1 each) = 10
        $response->assertJsonPath('data.enrollment_year_calculated_count', 1);
        $this->assertSame(2016, Student::where('admission_number', 'ADM-1')->first()->enrollment_year);
    }

    public function test_pre_unit_and_nursery_count_as_two_years_each_in_the_offset(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2026/2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);
        $this->createStandardProgression($school->id);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv(
                "admission_number,first_name,last_name,class_name\n"
                ."ADM-1,Amina,Hassan,Pre-Unit\n"
                ."ADM-2,Baraka,Maeda,Nursery\n"
                ."ADM-3,Hawa,Abubakari,Standard 1\n"
            ),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.enrollment_year_calculated_count', 3);
        $this->assertSame(2026, Student::where('admission_number', 'ADM-1')->first()->enrollment_year);
        $this->assertSame(2024, Student::where('admission_number', 'ADM-2')->first()->enrollment_year);
        $this->assertSame(2022, Student::where('admission_number', 'ADM-3')->first()->enrollment_year);
    }

    public function test_an_implausible_enrollment_year_is_warned_about_and_not_saved(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2026/2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);
        $this->createStandardProgression($school->id);
        $owner = $this->createUser($school, 'School Owner');

        // offset(Standard 7) = 10, so this calculates 2016 — but this
        // student's date of birth is after that — clearly wrong.
        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,date_of_birth,class_name\nADM-1,Juma,Kimaro,6/1/2021,Standard 7\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.enrollment_year_calculated_count', 0);
        $this->assertNotEmpty($response->json('data.rows.0.warnings'));
        $this->assertNull(Student::where('admission_number', 'ADM-1')->first()->enrollment_year);
    }

    public function test_an_already_calculated_enrollment_year_is_preserved_on_a_routine_reimport(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2026/2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);
        $this->createStandardProgression($school->id);
        $owner = $this->createUser($school, 'School Owner');

        // First import: student in Standard 1 (offset 4) -> 2022.
        $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Juma,Kimaro,Standard 1\n"),
            'dry_run' => 'false',
        ]);
        $this->assertSame(2022, Student::where('admission_number', 'ADM-1')->first()->enrollment_year);

        // Promoted to Standard 2 (offset 5) the following year, re-imported
        // without asking for recalculation: enrollment_year must not move,
        // even though it's now sitting under a different class's offset.
        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Juma,Kimaro,Standard 2\n"),
            'dry_run' => 'false',
        ]);
        $response->assertJsonPath('data.enrollment_year_calculated_count', 0);
        $this->assertSame(2022, Student::where('admission_number', 'ADM-1')->first()->enrollment_year);

        // An explicit recalculation pass, however, is allowed to change it.
        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Juma,Kimaro,Standard 2\n"),
            'dry_run' => 'false',
            'recalculate_enrollment_year' => 'true',
        ]);
        $response->assertJsonPath('data.enrollment_year_calculated_count', 1);
        $this->assertSame(2021, Student::where('admission_number', 'ADM-1')->first()->enrollment_year);
    }

    public function test_class_name_matching_tolerates_doubled_internal_whitespace(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->post('/api/school/students/import', [
            'file' => $this->csv("admission_number,first_name,last_name,class_name\nADM-1,Amina,Hassan,Form  1\n"),
            'dry_run' => 'false',
        ]);

        $response->assertJsonPath('data.rows.0.warnings', []);
        $response->assertJsonPath('data.class_assigned_count', 1);
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
