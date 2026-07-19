<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards LogsActivity — the audit trail behind who-changed-what for money
 * and grades. The two properties that matter most: a log entry always
 * attributes the right user, and it never crosses schools (same tenant-
 * isolation stakes as every other table, see TenantIsolationTest).
 */
class ActivityLogTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_creating_an_expense_is_logged_with_the_acting_user(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $category = ExpenseCategory::create(['school_id' => $school->id, 'name' => 'Fuel']);

        $create = $this->actingAs($owner, 'web')->postJson('/api/school/expenses', [
            'expense_category_id' => $category->id,
            'amount' => 50000,
            'description' => 'Diesel',
            'expense_date' => '2026-07-18',
        ]);
        $create->assertCreated();

        $logs = $this->actingAs($owner, 'web')->getJson('/api/school/activity-logs');
        $logs->assertOk();
        $entry = collect($logs->json('data'))->firstWhere('subject_type', 'Expense');
        $this->assertNotNull($entry);
        $this->assertSame('created', $entry['action']);
        $this->assertSame($owner->name, $entry['user_name']);
    }

    public function test_updating_an_expense_logs_the_old_and_new_values(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $category = ExpenseCategory::create(['school_id' => $school->id, 'name' => 'Fuel']);
        $expense = Expense::create([
            'school_id' => $school->id,
            'expense_category_id' => $category->id,
            'amount' => 50000,
            'description' => 'Diesel',
            'expense_date' => '2026-07-18',
        ]);

        $update = $this->actingAs($owner, 'web')->putJson("/api/school/expenses/{$expense->id}", [
            'expense_category_id' => $category->id,
            'amount' => 75000,
            'description' => 'Diesel (revised)',
            'expense_date' => '2026-07-18',
        ]);
        $update->assertOk();

        $logs = $this->actingAs($owner, 'web')->getJson('/api/school/activity-logs');
        $entry = collect($logs->json('data'))->firstWhere('action', 'updated');
        $this->assertNotNull($entry);
        $this->assertSame('50000.00', $entry['changes']['amount']['old']);
        $this->assertEquals(75000, $entry['changes']['amount']['new']);
    }

    public function test_a_student_without_a_permission_check_cannot_view_the_log(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->getJson('/api/school/activity-logs');

        $response->assertForbidden();
    }

    public function test_activity_logs_never_cross_schools(): void
    {
        $this->seedPermissions();
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        $ownerA = $this->createUser($schoolA, 'School Owner');
        $ownerB = $this->createUser($schoolB, 'School Owner');
        $categoryB = ExpenseCategory::create(['school_id' => $schoolB->id, 'name' => 'Fuel']);

        $this->actingAs($ownerB, 'web')->postJson('/api/school/expenses', [
            'expense_category_id' => $categoryB->id,
            'amount' => 10000,
            'description' => "School B's own expense",
            'expense_date' => '2026-07-18',
        ])->assertCreated();

        $logsForA = $this->actingAs($ownerA, 'web')->getJson('/api/school/activity-logs');

        $this->assertCount(0, $logsForA->json('data'));
    }

    public function test_exam_result_stub_creation_is_not_logged_but_recording_marks_is(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $student = $fixture['students']->first();

        // Simulates the stub row ExamService::addSubject() creates for
        // every actively-enrolled student the moment a subject is added to
        // an exam — createExamWithSubject() itself doesn't go through that
        // service, so the fixture builds the same stub state directly.
        $this->recordMark($fixture['school'], $examSubject, $student, null);
        $beforeGrading = $this->actingAs($owner, 'web')->getJson('/api/school/activity-logs');
        $this->assertCount(0, collect($beforeGrading->json('data'))->where('subject_type', 'ExamResult'));

        $this->actingAs($owner, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => [['student_id' => $student->id, 'marks_obtained' => 88]],
        ])->assertOk();

        $afterGrading = $this->actingAs($owner, 'web')->getJson('/api/school/activity-logs');
        $examResultLogs = collect($afterGrading->json('data'))->where('subject_type', 'ExamResult');
        $this->assertCount(1, $examResultLogs);
        $this->assertSame('updated', $examResultLogs->first()['action']);
    }

    public function test_the_subject_types_endpoint_only_returns_types_actually_logged(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $category = ExpenseCategory::create(['school_id' => $school->id, 'name' => 'Fuel']);
        $this->actingAs($owner, 'web')->postJson('/api/school/expenses', [
            'expense_category_id' => $category->id,
            'amount' => 1000,
            'description' => 'Test',
            'expense_date' => '2026-07-18',
        ])->assertCreated();

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/activity-log-subject-types');

        $response->assertJson(['data' => ['Expense']]);
    }
}
