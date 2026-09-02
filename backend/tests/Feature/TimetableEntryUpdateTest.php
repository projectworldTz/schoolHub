<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\TimetableEntry;
use App\Models\TimetablePeriod;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class TimetableEntryUpdateTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_school_can_update_a_timetable_lessons_subject_and_teacher(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $school = $fixture['school'];
        $owner = $this->createUser($school, 'School Owner');
        $firstTeacher = $this->createUser($school, 'Teacher');
        $secondTeacher = $this->createUser($school, 'Teacher');
        $secondSubject = Subject::create([
            'school_id' => $school->id,
            'name' => 'English',
        ]);
        $period = TimetablePeriod::create([
            'school_id' => $school->id,
            'name' => 'Period 1',
            'start_time' => '08:00',
            'end_time' => '08:40',
            'sort_order' => 1,
        ]);
        $entry = TimetableEntry::create([
            'school_id' => $school->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'subject_id' => $fixture['subject']->id,
            'teacher_id' => $firstTeacher->id,
            'timetable_period_id' => $period->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'day_of_week' => 'monday',
        ]);

        $this->actingAs($owner, 'web')->putJson("/api/school/timetable-entries/{$entry->id}", [
            'school_class_id' => $fixture['schoolClass']->id,
            'subject_id' => $secondSubject->id,
            'teacher_id' => $secondTeacher->id,
            'timetable_period_id' => $period->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'day_of_week' => 'monday',
        ])->assertOk()
            ->assertJsonPath('data.subject_id', $secondSubject->id)
            ->assertJsonPath('data.teacher_id', $secondTeacher->id)
            ->assertJsonPath('data.subject_name', 'English')
            ->assertJsonPath('data.teacher_name', $secondTeacher->name);

        $this->assertDatabaseHas('timetable_entries', [
            'id' => $entry->id,
            'school_id' => $school->id,
            'subject_id' => $secondSubject->id,
            'teacher_id' => $secondTeacher->id,
        ]);
    }
}
