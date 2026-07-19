<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the permission split made this session: 'exams.manage' (exam
 * administration — creating exam subjects, setting pass marks, generating
 * report cards) vs the narrower 'exam-marks.record' (gradebook entry only).
 * A regression here — e.g. a future change accidentally re-granting
 * Teacher the broad permission — would let a subject teacher change
 * another subject's pass mark, which is exactly the gap Phase7's
 * permission split closed.
 */
class ExamPermissionSplitTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_teacher_can_record_marks(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $response = $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => $fixture['students']->map(fn ($s) => ['student_id' => $s->id, 'marks_obtained' => 75])->all(),
        ]);

        $response->assertOk();
    }

    public function test_a_teacher_cannot_add_a_subject_to_an_exam(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass();
        ['exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson("/api/school/exams/{$exam->id}/subjects", [
            'school_class_id' => $fixture['schoolClass']->id,
            'subject_id' => $fixture['subject']->id,
            'max_marks' => 100,
            'pass_marks' => 40,
        ]);

        $response->assertForbidden();
    }

    public function test_a_teacher_cannot_generate_a_report_card(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $this->recordMark($fixture['school'], $examSubject, $fixture['students']->first(), 80);
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $response = $this->actingAs($teacher, 'web')
            ->getJson("/api/school/students/{$fixture['students']->first()->id}/report-card?exam_id={$exam->id}");

        $response->assertForbidden();
    }

    public function test_a_class_teacher_can_both_administer_exams_and_record_marks(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $classTeacher = $this->createUser($fixture['school'], 'Class Teacher');

        // A second subject, distinct from the one createExamWithSubject()
        // already attached — otherwise this insert would collide with the
        // (exam_id, school_class_id, subject_id) unique constraint.
        $secondSubject = \App\Models\Subject::create([
            'school_id' => $fixture['school']->id,
            'name' => 'English',
            'code' => 'ENG',
        ]);

        $addSubject = $this->actingAs($classTeacher, 'web')->postJson("/api/school/exams/{$exam->id}/subjects", [
            'school_class_id' => $fixture['schoolClass']->id,
            'subject_id' => $secondSubject->id,
            'max_marks' => 50,
            'pass_marks' => 20,
        ]);
        $addSubject->assertCreated();

        $newExamSubjectId = $addSubject->json('data.id');
        $recordMarks = $this->actingAs($classTeacher, 'web')->putJson("/api/school/exam-subjects/{$newExamSubjectId}/results", [
            'records' => [['student_id' => $fixture['students']->first()->id, 'marks_obtained' => 45]],
        ]);
        $recordMarks->assertOk();
    }
}
