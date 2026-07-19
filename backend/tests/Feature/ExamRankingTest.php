<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards ExamService::classRanking()/assignCompetitionRank() — the "who's
 * first in class" logic behind report cards, the Notice Board, and the
 * Parent Portal. Ties are the sharp edge here: two students tied for 2nd
 * must both show position 2, and whoever comes next must show position 4
 * (not 3) — "1, 2, 2, 4", standard competition ranking.
 */
class ExamRankingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_students_are_ranked_highest_average_first(): void
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
            "/api/school/exams/{$exam->id}/report-cards/ranking?school_class_id={$fixture['schoolClass']->id}"
        );

        $response->assertOk();
        $ranking = collect($response->json('data'));
        $this->assertSame($high->id, $ranking[0]['student_id']);
        $this->assertSame(1, $ranking[0]['position']);
        $this->assertSame($mid->id, $ranking[1]['student_id']);
        $this->assertSame(2, $ranking[1]['position']);
        $this->assertSame($low->id, $ranking[2]['student_id']);
        $this->assertSame(3, $ranking[2]['position']);
    }

    public function test_tied_scores_share_a_position_and_the_next_rank_skips_ahead(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 4);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        [$first, $tiedA, $tiedB, $last] = $fixture['students'];
        $this->recordMark($fixture['school'], $examSubject, $first, 90);
        $this->recordMark($fixture['school'], $examSubject, $tiedA, 70);
        $this->recordMark($fixture['school'], $examSubject, $tiedB, 70);
        $this->recordMark($fixture['school'], $examSubject, $last, 50);

        $owner = $this->createUser($fixture['school'], 'School Owner');
        $response = $this->actingAs($owner, 'web')->getJson(
            "/api/school/exams/{$exam->id}/report-cards/ranking?school_class_id={$fixture['schoolClass']->id}"
        );

        $positions = collect($response->json('data'))->pluck('position', 'student_id');
        $this->assertSame(1, $positions[$first->id]);
        $this->assertSame(2, $positions[$tiedA->id]);
        $this->assertSame(2, $positions[$tiedB->id]);
        $this->assertSame(4, $positions[$last->id], 'Position after a tie must skip ahead by the number tied (4, not 3)');
    }

    public function test_a_student_with_no_marks_recorded_is_excluded_from_ranking(): void
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
            "/api/school/exams/{$exam->id}/report-cards/ranking?school_class_id={$fixture['schoolClass']->id}"
        );

        $ids = collect($response->json('data'))->pluck('student_id');
        $this->assertContains($graded->id, $ids);
        $this->assertNotContains($ungraded->id, $ids);
    }

    public function test_grade_is_computed_from_the_default_grading_systems_bands(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $student = $fixture['students']->first();
        // 85/100 = 85% -> band A (80-100) per SetsUpTenant's fixture.
        $this->recordMark($fixture['school'], $examSubject, $student, 85);

        $owner = $this->createUser($fixture['school'], 'School Owner');
        $response = $this->actingAs($owner, 'web')->getJson(
            "/api/school/exams/{$exam->id}/report-cards/ranking?school_class_id={$fixture['schoolClass']->id}"
        );

        $row = collect($response->json('data'))->firstWhere('student_id', $student->id);
        $this->assertSame('A', $row['grade']);
    }
}
