<?php

namespace Tests\Feature;

use App\Models\FeeCategory;
use App\Models\FeeStructure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Covers the student-level fee exclusion flow: excluding a student from an
 * optional fee category retroactively strips it from their already-generated
 * invoices, mandatory categories can't be excluded, and a future invoice
 * generation run skips excluded categories (or the whole student, if every
 * selected fee was excluded for them) instead of billing for them anyway.
 */
class StudentFeeExclusionTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function createFeeStructure(\App\Models\School $school, \App\Models\AcademicYear $academicYear, \App\Models\SchoolClass $schoolClass, string $categoryName, bool $isOptional, float $amount): FeeStructure
    {
        $category = FeeCategory::create([
            'school_id' => $school->id,
            'name' => $categoryName,
            'is_optional' => $isOptional,
        ]);

        return FeeStructure::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'school_class_id' => $schoolClass->id,
            'fee_category_id' => $category->id,
            'amount' => $amount,
        ]);
    }

    public function test_excluding_a_student_from_an_optional_fee_strips_it_from_their_existing_invoice(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $tuition = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Tuition', false, 2000000);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $fixture['students']->first();

        $this->actingAs($owner, 'web')->postJson('/api/school/invoices/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$tuition->id, $transport->id],
        ])->assertOk();

        $this->assertDatabaseHas('invoices', ['student_id' => $student->id, 'total_amount' => 2300000]);

        $response = $this->actingAs($owner, 'web')->postJson("/api/school/students/{$student->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
            'reason' => 'Does not use school transport',
        ]);

        $response->assertCreated();
        $this->assertCount(1, $response->json('adjusted_invoices'));
        $this->assertEquals(2000000, $response->json('adjusted_invoices.0.total_amount'));
        $this->assertDatabaseHas('invoices', ['student_id' => $student->id, 'total_amount' => 2000000]);
        $this->assertDatabaseHas('student_fee_exclusions', [
            'student_id' => $student->id,
            'fee_category_id' => $transport->fee_category_id,
        ]);
    }

    public function test_excluding_a_student_from_a_mandatory_fee_is_rejected(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $tuition = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Tuition', false, 2000000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $fixture['students']->first();

        $response = $this->actingAs($owner, 'web')->postJson("/api/school/students/{$student->id}/fee-exclusions", [
            'fee_category_id' => $tuition->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('student_fee_exclusions', ['student_id' => $student->id]);
    }

    public function test_invoice_generation_skips_an_excluded_category_for_that_student_but_not_others(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        $tuition = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Tuition', false, 2000000);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        [$excludedStudent, $otherStudent] = $fixture['students']->all();

        $this->actingAs($owner, 'web')->postJson("/api/school/students/{$excludedStudent->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
        ])->assertCreated();

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/invoices/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$tuition->id, $transport->id],
        ]);

        $response->assertOk();
        $this->assertEmpty($response->json('skipped_students'));
        $this->assertDatabaseHas('invoices', ['student_id' => $excludedStudent->id, 'total_amount' => 2000000]);
        $this->assertDatabaseHas('invoices', ['student_id' => $otherStudent->id, 'total_amount' => 2300000]);
    }

    public function test_invoice_generation_skips_a_student_entirely_when_every_selected_fee_is_excluded_for_them(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        [$excludedStudent, $otherStudent] = $fixture['students']->all();

        $this->actingAs($owner, 'web')->postJson("/api/school/students/{$excludedStudent->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
        ])->assertCreated();

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/invoices/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'fee_structure_ids' => [$transport->id],
        ]);

        $response->assertOk();
        $this->assertCount(1, $response->json('skipped_students'));
        $this->assertEquals($excludedStudent->id, $response->json('skipped_students.0.id'));
        $this->assertDatabaseMissing('invoices', ['student_id' => $excludedStudent->id]);
        $this->assertDatabaseHas('invoices', ['student_id' => $otherStudent->id, 'total_amount' => 300000]);
    }

    public function test_restoring_an_exclusion_removes_it_without_touching_past_invoices(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $fixture['students']->first();

        $exclusion = $this->actingAs($owner, 'web')->postJson("/api/school/students/{$student->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
        ])->json('data');

        $response = $this->actingAs($owner, 'web')->deleteJson("/api/school/students/{$student->id}/fee-exclusions/{$exclusion['id']}");

        $response->assertNoContent();
        $this->assertSoftDeleted('student_fee_exclusions', ['id' => $exclusion['id']]);
    }

    public function test_updating_an_exclusion_changes_its_reason_only(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $fixture['students']->first();

        $exclusion = $this->actingAs($owner, 'web')->postJson("/api/school/students/{$student->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
            'reason' => 'Original reason',
        ])->json('data');

        $response = $this->actingAs($owner, 'web')->patchJson("/api/school/students/{$student->id}/fee-exclusions/{$exclusion['id']}", [
            'reason' => 'Updated reason',
        ]);

        $response->assertOk();
        $this->assertEquals('Updated reason', $response->json('data.reason'));
        $this->assertDatabaseHas('student_fee_exclusions', [
            'id' => $exclusion['id'],
            'reason' => 'Updated reason',
            'fee_category_id' => $transport->fee_category_id,
        ]);
    }

    public function test_a_user_without_finance_manage_cannot_update_an_exclusion(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $student = $fixture['students']->first();

        $exclusion = $this->actingAs($owner, 'web')->postJson("/api/school/students/{$student->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
        ])->json('data');

        $response = $this->actingAs($teacher, 'web')->patchJson("/api/school/students/{$student->id}/fee-exclusions/{$exclusion['id']}", [
            'reason' => 'Should not be allowed',
        ]);

        $response->assertStatus(403);
    }

    public function test_a_user_without_finance_manage_cannot_exclude_a_student_from_a_fee(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $transport = $this->createFeeStructure($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], 'Transport', true, 300000);
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $student = $fixture['students']->first();

        $response = $this->actingAs($teacher, 'web')->postJson("/api/school/students/{$student->id}/fee-exclusions", [
            'fee_category_id' => $transport->fee_category_id,
            'academic_year_id' => $fixture['academicYear']->id,
        ]);

        $response->assertStatus(403);
    }
}
