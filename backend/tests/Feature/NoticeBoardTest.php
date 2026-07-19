<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * The Notice Board is deliberately public (no login) — which makes its
 * safety checks the ones most worth locking down with tests: an exam must
 * be explicitly 'published' (not just graded), and one school's slug must
 * never expose another school's data. See NoticeBoardController for why
 * {exam}/{schoolClass} are resolved manually rather than via Eloquent
 * route-model-binding — a bug this suite would have caught immediately
 * (every request would have 404'd).
 */
class NoticeBoardTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_published_exams_ranking_is_visible_with_no_authentication(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject'], status: 'published'
        );
        foreach ($fixture['students'] as $i => $student) {
            $this->recordMark($fixture['school'], $examSubject, $student, 90 - $i * 10);
        }

        // Deliberately no actingAs() — this is the whole point of the Notice Board.
        $response = $this->getJson(
            "/api/public/schools/{$fixture['school']->slug}/notice-board/exams/{$exam->id}/classes/{$fixture['schoolClass']->id}/ranking"
        );

        $response->assertOk();
        $response->assertJsonPath('data.class_name', 'Form 1');
        $this->assertCount(2, $response->json('data.ranking'));
    }

    public function test_a_completed_but_not_published_exam_is_not_visible(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject'], status: 'completed'
        );
        $this->recordMark($fixture['school'], $examSubject, $fixture['students']->first(), 90);

        $response = $this->getJson(
            "/api/public/schools/{$fixture['school']->slug}/notice-board/exams/{$exam->id}/classes/{$fixture['schoolClass']->id}/ranking"
        );

        $response->assertNotFound();
    }

    public function test_the_exams_list_only_shows_published_exams_for_that_school(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass();
        $this->createExamWithSubject($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject'], status: 'draft');
        $this->createExamWithSubject($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject'], status: 'completed');
        ['exam' => $published] = $this->createExamWithSubject($fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject'], status: 'published');

        $response = $this->getJson("/api/public/schools/{$fixture['school']->slug}/notice-board/exams");

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertCount(1, $ids);
        $this->assertContains($published->id, $ids);
    }

    public function test_an_unknown_school_slug_404s_without_leaking_whether_it_exists(): void
    {
        $response = $this->getJson('/api/public/schools/does-not-exist/notice-board/exams');

        $response->assertNotFound();
    }

    public function test_one_schools_slug_never_exposes_another_schools_published_exam(): void
    {
        $this->seedPermissions();
        $schoolA = $this->setUpSchoolWithClass(studentCount: 1);
        $schoolB = $this->setUpSchoolWithClass(studentCount: 1);

        ['examSubject' => $examSubjectB, 'exam' => $examB] = $this->createExamWithSubject(
            $schoolB['school'], $schoolB['academicYear'], $schoolB['schoolClass'], $schoolB['subject'], status: 'published'
        );
        $this->recordMark($schoolB['school'], $examSubjectB, $schoolB['students']->first(), 90);

        // Ask School A's slug for School B's (published!) exam id.
        $response = $this->getJson(
            "/api/public/schools/{$schoolA['school']->slug}/notice-board/exams/{$examB->id}/classes/{$schoolB['schoolClass']->id}/ranking"
        );

        $response->assertNotFound();
    }

    public function test_a_suspended_school_is_not_reachable_on_the_notice_board(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass();
        $fixture['school']->update(['status' => 'suspended']);

        $response = $this->getJson("/api/public/schools/{$fixture['school']->slug}/notice-board/exams");

        $response->assertNotFound();
    }
}
