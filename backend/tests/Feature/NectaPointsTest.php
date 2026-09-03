<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class NectaPointsTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_opted_in_school_gets_its_configured_points_and_division_on_report_card(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        $system = $fixture['gradingSystem'];
        $system->update([
            'necta_enabled' => true,
            'points_subject_count' => 1,
            'division_rules' => [['label' => 'Division I', 'min_points' => 1, 'max_points' => 2]],
        ]);
        $system->gradeBands()->where('label', 'A')->update(['points' => 1]);

        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $student = $fixture['students']->first();
        $this->recordMark($fixture['school'], $examSubject, $student, 90, 'A');
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $this->actingAs($owner, 'web')->getJson("/api/school/students/{$student->id}/report-card?exam_id={$exam->id}")
            ->assertOk()
            ->assertJsonPath('data.summary.necta.total_points', 1)
            ->assertJsonPath('data.summary.necta.division', 'Division I')
            ->assertJsonPath('data.summary.necta.subjects_counted', 1);
    }

    public function test_existing_school_not_opted_in_keeps_points_summary_disabled(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(1);
        ['examSubject' => $examSubject, 'exam' => $exam] = $this->createExamWithSubject(
            $fixture['school'], $fixture['academicYear'], $fixture['schoolClass'], $fixture['subject']
        );
        $student = $fixture['students']->first();
        $this->recordMark($fixture['school'], $examSubject, $student, 90, 'A');
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $this->actingAs($owner, 'web')->getJson("/api/school/students/{$student->id}/report-card?exam_id={$exam->id}")
            ->assertOk()
            ->assertJsonPath('data.summary.necta', null);
    }
}
