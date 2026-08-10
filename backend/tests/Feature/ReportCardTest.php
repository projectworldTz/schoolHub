<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class ReportCardTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_report_card_shows_class_rank_grade_and_a_performance_message(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        [$top, $bottom] = $fixture['students'];
        $this->recordMark($fixture['school'], $examSubject, $top, 90);
        $this->recordMark($fixture['school'], $examSubject, $bottom, 30);

        $owner = $this->createUser($fixture['school'], 'School Owner');
        $response = $this->actingAs($owner, 'web')
            ->getJson("/api/school/students/{$top->id}/report-card?exam_id={$exam->id}");

        $response->assertOk();
        $response->assertJsonPath('data.summary.class_position', 1);
        $response->assertJsonPath('data.summary.class_size', 2);
        $response->assertJsonPath('data.summary.overall_grade', 'A');
        $response->assertJsonPath('data.summary.performance_message.tier', 'excellent');
        $response->assertJsonPath('data.subjects.0.subject_position', 1);
    }

    public function test_a_class_teachers_manual_remark_persists_and_appears_on_the_report_card(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $student = $fixture['students']->first();
        $this->recordMark($fixture['school'], $examSubject, $student, 60);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $setRemark = $this->actingAs($owner, 'web')
            ->putJson("/api/school/exams/{$exam->id}/students/{$student->id}/remark", [
                'remark' => 'Good effort this term.',
            ]);
        $setRemark->assertOk();

        $reportCard = $this->actingAs($owner, 'web')
            ->getJson("/api/school/students/{$student->id}/report-card?exam_id={$exam->id}");

        $reportCard->assertJsonPath('data.summary.class_teacher_remark', 'Good effort this term.');
    }

    public function test_a_report_card_pdf_downloads_successfully(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $student = $fixture['students']->first();
        $this->recordMark($fixture['school'], $examSubject, $student, 75);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')
            ->get("/api/school/students/{$student->id}/report-card/pdf?exam_id={$exam->id}");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_bulk_pdf_includes_every_graded_student_in_the_class(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 3);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        foreach ($fixture['students'] as $student) {
            $this->recordMark($fixture['school'], $examSubject, $student, 60);
        }
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->get(
            "/api/school/exams/{$exam->id}/report-cards/pdf?school_class_id={$fixture['schoolClass']->id}"
        );

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_bulk_pdf_404s_when_no_students_are_graded_yet(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->get(
            "/api/school/exams/{$exam->id}/report-cards/pdf?school_class_id={$fixture['schoolClass']->id}"
        );

        $response->assertNotFound();
    }

    public function test_class_results_pdf_downloads_successfully(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        foreach ($fixture['students'] as $student) {
            $this->recordMark($fixture['school'], $examSubject, $student, 60);
        }
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->get(
            "/api/school/exams/{$exam->id}/report-cards/class-results-pdf?school_class_id={$fixture['schoolClass']->id}"
        );

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_class_results_pdf_includes_every_subject_and_a_pass_fail_summary(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        [$topStudent, $bottomStudent] = $fixture['students'];

        $science = \App\Models\Subject::create([
            'school_id' => $fixture['school']->id,
            'name' => 'Science',
            'code' => 'SCI',
        ]);
        ['examSubject' => $mathSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $scienceSubject = \App\Models\ExamSubject::create([
            'school_id' => $fixture['school']->id,
            'exam_id' => $exam->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'subject_id' => $science->id,
            'max_marks' => 100,
            'pass_marks' => 40,
        ]);

        // Top student scores an A in both subjects; bottom student fails both.
        $this->recordMark($fixture['school'], $mathSubject, $topStudent, 90, 'A');
        $this->recordMark($fixture['school'], $scienceSubject, $topStudent, 85, 'A');
        $this->recordMark($fixture['school'], $mathSubject, $bottomStudent, 30, 'F');
        $this->recordMark($fixture['school'], $scienceSubject, $bottomStudent, 25, 'F');

        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->get(
            "/api/school/exams/{$exam->id}/report-cards/class-results-pdf?school_class_id={$fixture['schoolClass']->id}"
        );

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_class_results_pdf_404s_when_no_students_are_graded_yet(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->get(
            "/api/school/exams/{$exam->id}/report-cards/class-results-pdf?school_class_id={$fixture['schoolClass']->id}"
        );

        $response->assertNotFound();
    }
}
