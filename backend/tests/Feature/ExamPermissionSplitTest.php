<?php

namespace Tests\Feature;

use App\Models\Stream;
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
 *
 * Also guards the class-assignment scoping added on top of that split:
 * exam-marks.record/exams.manage are held school-wide, so without a
 * per-class ownership check any teacher could touch any class's gradebook
 * by UUID — see User::canAccessClass().
 */
class ExamPermissionSplitTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_teacher_assigned_to_the_class_can_record_marks(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        $teacher->assignedClasses()->attach($fixture['schoolClass']->id);

        $response = $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => $fixture['students']->map(fn ($s) => ['student_id' => $s->id, 'marks_obtained' => 75])->all(),
        ]);

        $response->assertOk();
    }

    public function test_a_teacher_not_assigned_to_the_class_cannot_record_marks(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        // Has exam-marks.record school-wide, but no assignment to this class.
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $response = $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => $fixture['students']->map(fn ($s) => ['student_id' => $s->id, 'marks_obtained' => 75])->all(),
        ]);

        $response->assertForbidden();
    }

    public function test_a_teacher_who_is_stream_homeroom_can_record_marks_without_explicit_assignment(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        Stream::create([
            'school_id' => $fixture['school']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'name' => 'Blue',
            'class_teacher_id' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => $fixture['students']->map(fn ($s) => ['student_id' => $s->id, 'marks_obtained' => 60])->all(),
        ]);

        $response->assertOk();
    }

    public function test_a_classes_manage_holder_can_record_marks_for_any_class(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        // School Owner holds classes.manage — sees/manages every class.
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->putJson("/api/school/exam-subjects/{$examSubject->id}/results", [
            'records' => $fixture['students']->map(fn ($s) => ['student_id' => $s->id, 'marks_obtained' => 60])->all(),
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

    public function test_a_class_teacher_cannot_add_an_exam_subject_for_a_class_they_are_not_assigned_to(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass();
        ['exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        // Holds exams.manage school-wide but isn't classes.manage and isn't
        // assigned to this particular class.
        $classTeacher = $this->createUser($fixture['school'], 'Class Teacher');

        $secondSubject = \App\Models\Subject::create([
            'school_id' => $fixture['school']->id,
            'name' => 'English',
            'code' => 'ENG',
        ]);

        $response = $this->actingAs($classTeacher, 'web')->postJson("/api/school/exams/{$exam->id}/subjects", [
            'school_class_id' => $fixture['schoolClass']->id,
            'subject_id' => $secondSubject->id,
            'max_marks' => 50,
            'pass_marks' => 20,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('school_class_id');
    }

    public function test_a_class_teacher_can_both_administer_exams_and_record_marks_for_their_own_class(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $classTeacher = $this->createUser($fixture['school'], 'Class Teacher');
        $classTeacher->assignedClasses()->attach($fixture['schoolClass']->id);

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
