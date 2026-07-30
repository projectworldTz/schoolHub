<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the "submit locks the gradebook" workflow: a teacher can freely
 * save marks until they explicitly submit; submitting starts a 24h grace
 * period during which they can still correct mistakes; past that window the
 * gradebook is locked until an Academic Master approves an edit request.
 */
class ExamEditLockTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_marks_can_be_saved_repeatedly_before_submission(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        foreach ($fixture['students'] as $student) {
            $this->recordMark($fixture['school'], $examSubject, $student, null);
        }
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);

        $records = $fixture['students']->map(fn ($s) => ['student_id' => $s->id, 'marks_obtained' => 70])->all();

        $this->actingAs($teacher, 'web')
            ->putJson("/api/school/exam-subjects/{$examSubject->id}/results", ['records' => $records])
            ->assertOk();

        $second = $this->actingAs($teacher, 'web')
            ->putJson("/api/school/exam-subjects/{$examSubject->id}/results", ['records' => $records])
            ->assertOk();

        $this->assertSame(70, (int) $second->json('data.0.marks_obtained'));
    }

    public function test_submitting_starts_the_grace_period_and_editing_still_works_within_it(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $this->recordMark($fixture['school'], $examSubject, $fixture['students']->first(), null);
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);

        $submit = $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit");
        $submit->assertOk();
        $this->assertNotNull($submit->json('data.submitted_at'));
        $this->assertFalse($submit->json('data.is_locked'));

        $this->travel(23)->hours();

        $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => [['student_id' => $fixture['students']->first()->id, 'marks_obtained' => 88]],
        ])->assertOk();
    }

    public function test_submitting_twice_is_rejected(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);

        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertOk();
        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertStatus(422);
    }

    public function test_editing_is_blocked_after_the_grace_period_elapses(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $this->recordMark($fixture['school'], $examSubject, $fixture['students']->first(), null);
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);

        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertOk();

        $this->travel(25)->hours();

        $response = $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => [['student_id' => $fixture['students']->first()->id, 'marks_obtained' => 88]],
        ]);

        $response->assertStatus(423);
        $this->assertTrue($examSubject->fresh()->isLocked());
    }

    public function test_a_teacher_can_request_an_edit_once_locked_and_an_academic_master_can_approve_it(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $this->recordMark($fixture['school'], $examSubject, $fixture['students']->first(), null);
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);
        $academicMaster = $this->createUser($fixture['school'], 'Academic Master');

        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertOk();
        $this->travel(25)->hours();

        // Blocked before any edit request exists.
        $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => [['student_id' => $fixture['students']->first()->id, 'marks_obtained' => 88]],
        ])->assertStatus(423);

        $requestEdit = $this->actingAs($teacher, 'web')->postJson('/api/school/exam-edit-requests', [
            'exam_subject_id' => $examSubject->id,
            'reason' => 'Transposed two students\' scores by mistake.',
        ]);
        $requestEdit->assertCreated();
        $editRequestId = $requestEdit->json('data.id');
        $this->assertSame('pending', $requestEdit->json('data.status'));

        // A second request while one is already pending is rejected.
        $this->actingAs($teacher, 'web')->postJson('/api/school/exam-edit-requests', [
            'exam_subject_id' => $examSubject->id,
            'reason' => 'Another reason.',
        ])->assertStatus(422);

        // Still locked — a pending (not yet approved) request doesn't unlock anything.
        $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => [['student_id' => $fixture['students']->first()->id, 'marks_obtained' => 88]],
        ])->assertStatus(423);

        // A plain teacher cannot approve their own (or anyone's) request.
        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-edit-requests/{$editRequestId}/review", [
            'status' => 'approved',
        ])->assertForbidden();

        $approve = $this->actingAs($academicMaster, 'web')->postJson("/api/school/exam-edit-requests/{$editRequestId}/review", [
            'status' => 'approved',
        ]);
        $approve->assertOk();
        $this->assertSame('approved', $approve->json('data.status'));
        $this->assertNotNull($approve->json('data.unlocked_until'));

        $this->assertFalse($examSubject->fresh()->isLocked());

        $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => [['student_id' => $fixture['students']->first()->id, 'marks_obtained' => 91]],
        ])->assertOk();
    }

    public function test_a_rejected_edit_request_leaves_the_gradebook_locked(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $this->recordMark($fixture['school'], $examSubject, $fixture['students']->first(), null);
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);
        $academicMaster = $this->createUser($fixture['school'], 'Academic Master');

        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertOk();
        $this->travel(25)->hours();

        $requestEdit = $this->actingAs($teacher, 'web')->postJson('/api/school/exam-edit-requests', [
            'exam_subject_id' => $examSubject->id,
            'reason' => 'Need to fix a typo.',
        ]);

        $this->actingAs($academicMaster, 'web')
            ->postJson("/api/school/exam-edit-requests/{$requestEdit->json('data.id')}/review", ['status' => 'rejected'])
            ->assertOk();

        $this->assertTrue($examSubject->fresh()->isLocked());
    }

    public function test_a_class_teacher_can_also_review_edit_requests(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);
        $classTeacher = $this->createUser($fixture['school'], 'Class Teacher');

        $this->actingAs($teacher, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertOk();
        $this->travel(25)->hours();

        $requestEdit = $this->actingAs($teacher, 'web')->postJson('/api/school/exam-edit-requests', [
            'exam_subject_id' => $examSubject->id,
            'reason' => 'Reason.',
        ]);

        // Class Teacher holds exams.manage in this app's role catalog, so is a valid reviewer.
        $this->actingAs($classTeacher, 'web')
            ->postJson("/api/school/exam-edit-requests/{$requestEdit->json('data.id')}/review", ['status' => 'approved'])
            ->assertOk();
    }

    public function test_index_shows_only_own_requests_to_a_teacher_but_all_to_an_academic_master(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacherA = $this->createUser($fixture['school'], 'Teacher');
        $teacherA->assignedClasses()->attach($fixture['schoolClass']->id);
        $teacherB = $this->createUser($fixture['school'], 'Teacher');
        $academicMaster = $this->createUser($fixture['school'], 'Academic Master');

        $this->actingAs($teacherA, 'web')->postJson("/api/school/exam-subjects/{$examSubject->id}/submit")->assertOk();
        $this->travel(25)->hours();

        $this->actingAs($teacherA, 'web')->postJson('/api/school/exam-edit-requests', [
            'exam_subject_id' => $examSubject->id,
            'reason' => 'Reason A.',
        ])->assertCreated();

        $asTeacherB = $this->actingAs($teacherB, 'web')->getJson('/api/school/exam-edit-requests');
        $asTeacherB->assertOk();
        $this->assertCount(0, $asTeacherB->json('data'));

        $asAcademicMaster = $this->actingAs($academicMaster, 'web')->getJson('/api/school/exam-edit-requests');
        $asAcademicMaster->assertOk();
        $this->assertCount(1, $asAcademicMaster->json('data'));
    }

    public function test_requesting_an_edit_when_not_locked_is_rejected(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/exam-edit-requests', [
            'exam_subject_id' => $examSubject->id,
            'reason' => 'No reason to need this yet.',
        ]);

        $response->assertStatus(422);
    }
}
