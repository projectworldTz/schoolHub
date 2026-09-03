<?php

namespace Tests\Feature;

use App\Models\TimetableEntry;
use App\Models\TimetablePeriod;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class TimetableGeneratorTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_generator_creates_required_and_double_periods_without_overwriting_existing_entries(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $fixture = $this->setUpSchoolWithClass(1);
        $owner = $this->createUser($fixture['school'], 'School Owner');
        $teacher = $this->createUser($fixture['school'], 'Teacher');
        foreach ([['P1', '08:00', '08:40'], ['P2', '08:40', '09:20'], ['P3', '09:40', '10:20']] as $i => $period) {
            TimetablePeriod::create([
                'school_id' => $fixture['school']->id, 'name' => $period[0],
                'start_time' => $period[1], 'end_time' => $period[2], 'sort_order' => $i + 1,
            ]);
        }

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/timetable-entries/generate', [
            'academic_year_id' => $fixture['academicYear']->id,
            'days' => ['monday', 'tuesday'],
            'assignments' => [[
                'school_class_id' => $fixture['schoolClass']->id,
                'subject_id' => $fixture['subject']->id,
                'teacher_id' => $teacher->id,
                'periods_per_week' => 3,
                'double_periods' => 1,
            ]],
        ]);

        $response->assertOk()->assertJsonCount(3, 'data');
        $this->assertSame(3, TimetableEntry::withoutGlobalScopes()->where('school_id', $fixture['school']->id)->count());
    }

    public function test_generator_rejects_cross_tenant_ids(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $a = $this->setUpSchoolWithClass(1);
        $b = $this->setUpSchoolWithClass(1);
        $ownerA = $this->createUser($a['school'], 'School Owner');
        $teacherA = $this->createUser($a['school'], 'Teacher');

        $this->actingAs($ownerA, 'web')->postJson('/api/school/timetable-entries/generate', [
            'academic_year_id' => $a['academicYear']->id,
            'assignments' => [[
                'school_class_id' => $b['schoolClass']->id,
                'subject_id' => $a['subject']->id,
                'teacher_id' => $teacherA->id,
                'periods_per_week' => 1,
            ]],
        ])->assertUnprocessable()->assertJsonValidationErrors('assignments.0.school_class_id');
    }
}
