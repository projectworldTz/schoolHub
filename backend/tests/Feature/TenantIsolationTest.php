<?php

namespace Tests\Feature;

use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * The single most important property of this entire application: a school
 * can NEVER see another school's data, over any endpoint. MySQL has no
 * Row-Level-Security backstop (see App\Models\Concerns\BelongsToSchool) —
 * this is the only thing standing between "multi-tenant SaaS" and "every
 * school reading every other school's students". A regression here is the
 * most damaging kind of bug this suite can catch.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_school_owner_cannot_list_another_schools_students(): void
    {
        $this->seedPermissions();

        $schoolA = $this->setUpSchoolWithClass(studentCount: 2);
        $schoolB = $this->setUpSchoolWithClass(studentCount: 2);

        $ownerA = $this->createUser($schoolA['school'], 'School Owner');

        $response = $this->actingAs($ownerA, 'web')->getJson('/api/school/students');

        $response->assertOk();
        $returnedIds = collect($response->json('data'))->pluck('id');

        foreach ($schoolA['students'] as $student) {
            $this->assertContains($student->id, $returnedIds);
        }
        foreach ($schoolB['students'] as $student) {
            $this->assertNotContains($student->id, $returnedIds, "School A must not see School B's student {$student->id}");
        }
    }

    public function test_a_school_owner_cannot_fetch_another_schools_student_by_id_directly(): void
    {
        $this->seedPermissions();

        $schoolA = $this->setUpSchoolWithClass(studentCount: 1);
        $schoolB = $this->setUpSchoolWithClass(studentCount: 1);

        $ownerA = $this->createUser($schoolA['school'], 'School Owner');
        $otherSchoolsStudent = $schoolB['students']->first();

        // Route-model-binding for {student} is scoped by BelongsToSchool
        // too — a direct-by-ID request for a student that exists, just in
        // a different school, must 404, not 403 (403 would confirm the row
        // exists at all, which is itself a minor information leak).
        $response = $this->actingAs($ownerA, 'web')->getJson("/api/school/students/{$otherSchoolsStudent->id}");

        $response->assertNotFound();
    }

    public function test_a_school_owner_cannot_see_another_schools_exams(): void
    {
        $this->seedPermissions();

        $schoolA = $this->setUpSchoolWithClass();
        $schoolB = $this->setUpSchoolWithClass();

        ['exam' => $examA] = $this->createExamWithSubject($schoolA['school'], $schoolA['academicYear'], $schoolA['schoolClass'], $schoolA['subject']);
        ['exam' => $examB] = $this->createExamWithSubject($schoolB['school'], $schoolB['academicYear'], $schoolB['schoolClass'], $schoolB['subject']);

        $ownerA = $this->createUser($schoolA['school'], 'School Owner');

        $response = $this->actingAs($ownerA, 'web')->getJson('/api/school/exams');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertContains($examA->id, $ids);
        $this->assertNotContains($examB->id, $ids);
    }

    public function test_creating_a_student_never_leaks_across_schools_even_with_the_same_admission_number(): void
    {
        $this->seedPermissions();

        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();

        // Same admission number reused in two different schools is legal —
        // uniqueness is scoped to (school_id, admission_number), not global.
        $studentA = Student::create([
            'school_id' => $schoolA->id,
            'admission_number' => 'ADM-001',
            'first_name' => 'Amina',
            'last_name' => 'A',
            'status' => 'active',
        ]);
        $studentB = Student::create([
            'school_id' => $schoolB->id,
            'admission_number' => 'ADM-001',
            'first_name' => 'Bakari',
            'last_name' => 'B',
            'status' => 'active',
        ]);

        $this->assertNotSame($studentA->id, $studentB->id);

        $ownerA = $this->createUser($schoolA, 'School Owner');
        $response = $this->actingAs($ownerA, 'web')->getJson('/api/school/students');

        $names = collect($response->json('data'))->pluck('first_name');
        $this->assertContains('Amina', $names);
        $this->assertNotContains('Bakari', $names);
    }
}
