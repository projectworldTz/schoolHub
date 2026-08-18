<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class PromotionTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    /**
     * Pre-Unit/Nursery are manual-only (auto_promote=false), Standard 1-7
     * are the automatic chain — the exact structure from the product spec,
     * expressed only through level ordering and the auto_promote flag,
     * never a hardcoded class name. Two academic years (2026 "from", 2027
     * "current"/"to") so promotion has somewhere to move students between.
     *
     * @return array{school: School, fromYear: AcademicYear, toYear: AcademicYear, preUnit: SchoolClass, nursery: SchoolClass, standard: array<int, SchoolClass>}
     */
    protected function createSchoolWithProgression(): array
    {
        $school = $this->createSchool();

        $fromYear = AcademicYear::create([
            'school_id' => $school->id, 'name' => '2026', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'is_current' => false,
        ]);
        $toYear = AcademicYear::create([
            'school_id' => $school->id, 'name' => '2027', 'start_date' => '2027-01-01', 'end_date' => '2027-12-31', 'is_current' => true,
        ]);

        $preUnit = SchoolClass::create(['school_id' => $school->id, 'name' => 'Pre-Unit', 'level' => 0, 'auto_promote' => false]);
        $nursery = SchoolClass::create(['school_id' => $school->id, 'name' => 'Nursery', 'level' => 1, 'auto_promote' => false]);

        $standard = [];
        foreach (range(1, 7) as $i) {
            $standard[$i] = SchoolClass::create(['school_id' => $school->id, 'name' => "Standard {$i}", 'level' => 1 + $i]);
        }

        return compact('school', 'fromYear', 'toYear', 'preUnit', 'nursery', 'standard');
    }

    protected function enrollStudent(School $school, AcademicYear $year, SchoolClass $class, string $admissionNumber): Student
    {
        $student = Student::firstOrCreate(
            ['school_id' => $school->id, 'admission_number' => $admissionNumber],
            ['first_name' => $admissionNumber, 'last_name' => 'Student', 'status' => 'active']
        );

        StudentEnrollment::create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'academic_year_id' => $year->id,
            'school_class_id' => $class->id,
            'status' => 'active',
            'enrolled_at' => $year->start_date,
        ]);

        return $student;
    }

    public function test_preview_resolves_the_next_class_from_level_ordering(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][3], 'ADM-1');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/promotions/preview');

        $response->assertOk();
        $classes = collect($response->json('data.classes'));
        $standard3 = $classes->firstWhere('from_school_class_name', 'Standard 3');
        $this->assertSame('Standard 4', $standard3['to_school_class_name']);
        $this->assertFalse($standard3['is_terminal']);
        $this->assertCount(1, $standard3['students']);
    }

    public function test_the_terminal_class_previews_as_graduating(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][7], 'ADM-1');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/promotions/preview');

        $classes = collect($response->json('data.classes'));
        $standard7 = $classes->firstWhere('from_school_class_name', 'Standard 7');
        $this->assertTrue($standard7['is_terminal']);
        $this->assertNull($standard7['to_school_class_id']);
    }

    public function test_manual_only_classes_are_reported_separately_from_the_automatic_list(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['preUnit'], 'ADM-1');
        $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['nursery'], 'ADM-2');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/promotions/preview');

        $this->assertEmpty($response->json('data.classes'));
        $manual = collect($response->json('data.manual_classes'))->pluck('school_class_name');
        $this->assertContains('Pre-Unit', $manual);
        $this->assertContains('Nursery', $manual);
    }

    public function test_committing_a_promotion_creates_a_new_enrollment_and_preserves_the_old_one(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][3], 'ADM-1');
        // withoutGlobalScopes(): no tenant context is set yet at this point
        // in the test — that only happens once the actingAs()+HTTP call
        // below runs — see SetsUpTenant's docblock.
        $oldEnrollmentId = StudentEnrollment::withoutGlobalScopes()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $fixture['fromYear']->id)
            ->first()->id;

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/promotions', [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [
                ['student_id' => $student->id, 'to_school_class_id' => $fixture['standard'][4]->id],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.promoted_count', 1);

        $this->assertSame(2, $student->enrollments()->count());
        $oldEnrollment = StudentEnrollment::find($oldEnrollmentId);
        $this->assertSame($fixture['standard'][3]->id, $oldEnrollment->school_class_id);
        $this->assertSame('active', $oldEnrollment->status);

        $student->load('currentEnrollment.schoolClass');
        $this->assertSame('Standard 4', $student->currentEnrollment->schoolClass->name);
    }

    public function test_committing_the_same_promotion_twice_does_not_promote_the_student_again(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][3], 'ADM-1');

        $payload = [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [
                ['student_id' => $student->id, 'to_school_class_id' => $fixture['standard'][4]->id],
            ],
        ];

        $this->actingAs($owner, 'web')->postJson('/api/school/promotions', $payload);
        $second = $this->actingAs($owner, 'web')->postJson('/api/school/promotions', $payload);

        $second->assertJsonPath('data.skipped_count', 1);
        $second->assertJsonPath('data.promoted_count', 0);
        $this->assertSame(2, $student->enrollments()->count());
    }

    public function test_a_student_excluded_from_the_decision_list_is_left_untouched(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $promoted = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][3], 'ADM-1');
        $excluded = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][3], 'ADM-2');

        $this->actingAs($owner, 'web')->postJson('/api/school/promotions', [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [
                ['student_id' => $promoted->id, 'to_school_class_id' => $fixture['standard'][4]->id],
            ],
        ]);

        $this->assertSame(2, $promoted->enrollments()->count());
        $this->assertSame(1, $excluded->enrollments()->count());
    }

    public function test_promoting_a_student_to_their_own_class_is_recorded_as_a_repeat(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][4], 'ADM-1');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/promotions', [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [
                ['student_id' => $student->id, 'to_school_class_id' => $fixture['standard'][4]->id],
            ],
        ]);

        $response->assertJsonPath('data.repeated_count', 1);
        $response->assertJsonPath('data.promoted_count', 0);

        $history = $this->actingAs($owner, 'web')->getJson('/api/school/promotions/history');
        $history->assertJsonPath('data.0.action', 'repeated');
    }

    public function test_the_terminal_class_graduates_students_instead_of_promoting_them(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][7], 'ADM-1');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/promotions', [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [
                ['student_id' => $student->id, 'graduate' => true],
            ],
        ]);

        $response->assertJsonPath('data.graduated_count', 1);
        $student->refresh();
        $this->assertSame('graduated', $student->status);
        $this->assertSame(1, Student::where('id', $student->id)->count(), 'Student record must not be deleted.');
        $this->assertDatabaseHas('student_status_changes', [
            'student_id' => $student->id,
            'to_status' => 'graduated',
        ]);
    }

    public function test_promotion_never_changes_enrollment_year(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['standard'][3], 'ADM-1');
        $student->update(['enrollment_year' => 2018]);

        $this->actingAs($owner, 'web')->postJson('/api/school/promotions', [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [
                ['student_id' => $student->id, 'to_school_class_id' => $fixture['standard'][4]->id],
            ],
        ]);

        $this->assertSame(2018, $student->fresh()->enrollment_year);
    }

    public function test_manual_promotion_works_for_a_class_marked_auto_promote_false(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $this->enrollStudent($fixture['school'], $fixture['fromYear'], $fixture['nursery'], 'ADM-1');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/promotions', [
            'from_academic_year_id' => $fixture['fromYear']->id,
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'manual',
            'decisions' => [
                ['student_id' => $student->id, 'to_school_class_id' => $fixture['standard'][1]->id],
            ],
        ]);

        $response->assertJsonPath('data.promoted_count', 1);
        $student->load('currentEnrollment.schoolClass');
        $this->assertSame('Standard 1', $student->currentEnrollment->schoolClass->name);

        $history = $this->actingAs($owner, 'web')->getJson('/api/school/promotions/history');
        $history->assertJsonPath('data.0.mode', 'manual');
    }

    public function test_a_role_without_graduation_manage_cannot_preview_or_commit(): void
    {
        $this->seedPermissions();
        $fixture = $this->createSchoolWithProgression();
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $preview = $this->actingAs($teacher, 'web')->getJson('/api/school/promotions/preview');
        $preview->assertForbidden();

        $commit = $this->actingAs($teacher, 'web')->postJson('/api/school/promotions', [
            'to_academic_year_id' => $fixture['toYear']->id,
            'mode' => 'automatic',
            'decisions' => [],
        ]);
        $commit->assertForbidden();
    }
}
