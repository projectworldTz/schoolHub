<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards AnalyticsController::academics()'s top_students field — a
 * school-wide "who's leading academically" ranking for the dashboard,
 * built the same way as $bySubject/$radarRows but grouped by student.
 */
class AnalyticsTopStudentsTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_top_students_are_ranked_by_average_percentage_descending(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 3);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        [$low, $mid, $high] = $fixture['students'];
        $this->recordMark($fixture['school'], $examSubject, $low, 40);
        $this->recordMark($fixture['school'], $examSubject, $mid, 70);
        $this->recordMark($fixture['school'], $examSubject, $high, 95);

        $owner = $this->createUser($fixture['school'], 'School Owner');
        $response = $this->actingAs($owner, 'web')->getJson(
            "/api/school/analytics/academics?exam_id={$exam->id}"
        );

        $response->assertOk();
        $topStudents = collect($response->json('data.top_students'));

        $this->assertSame($high->id, $topStudents[0]['student_id']);
        $this->assertEquals(95.0, $topStudents[0]['average_percentage']);
        $this->assertSame($fixture['schoolClass']->name, $topStudents[0]['class_name']);
        $this->assertSame($mid->id, $topStudents[1]['student_id']);
        $this->assertSame($low->id, $topStudents[2]['student_id']);
    }

    public function test_a_student_with_no_marks_recorded_is_excluded_from_top_students(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        [$graded, $ungraded] = $fixture['students'];
        $this->recordMark($fixture['school'], $examSubject, $graded, 60);
        $this->recordMark($fixture['school'], $examSubject, $ungraded, null);

        $owner = $this->createUser($fixture['school'], 'School Owner');
        $response = $this->actingAs($owner, 'web')->getJson(
            "/api/school/analytics/academics?exam_id={$exam->id}"
        );

        $ids = collect($response->json('data.top_students'))->pluck('student_id');
        $this->assertContains($graded->id, $ids);
        $this->assertNotContains($ungraded->id, $ids);
    }
}
