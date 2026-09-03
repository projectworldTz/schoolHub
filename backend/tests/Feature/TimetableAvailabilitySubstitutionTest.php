<?php

namespace Tests\Feature;

use App\Models\TimetableEntry;
use App\Models\TimetablePeriod;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class TimetableAvailabilitySubstitutionTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_saved_unavailability_is_used_by_generation(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $f = $this->setUpSchoolWithClass(1);
        $owner = $this->createUser($f['school'], 'School Owner');
        $teacher = $this->createUser($f['school'], 'Teacher');
        $period = TimetablePeriod::create(['school_id' => $f['school']->id, 'name' => 'P1', 'start_time' => '08:00', 'end_time' => '08:40']);

        $this->actingAs($owner, 'web')->putJson('/api/school/teacher-availabilities', [
            'teacher_id' => $teacher->id, 'academic_year_id' => $f['academicYear']->id,
            'unavailable_slots' => [['day_of_week' => 'monday', 'timetable_period_id' => $period->id]],
        ])->assertOk();

        $this->actingAs($owner, 'web')->postJson('/api/school/timetable-entries/generate', [
            'academic_year_id' => $f['academicYear']->id, 'days' => ['monday', 'tuesday'],
            'assignments' => [['school_class_id' => $f['schoolClass']->id, 'subject_id' => $f['subject']->id, 'teacher_id' => $teacher->id, 'periods_per_week' => 1]],
        ])->assertOk()->assertJsonPath('data.0.day_of_week', 'tuesday');
    }

    public function test_substitution_is_dated_and_tenant_isolated(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $a = $this->setUpSchoolWithClass(1);
        $b = $this->setUpSchoolWithClass(1);
        $owner = $this->createUser($a['school'], 'School Owner');
        $regular = $this->createUser($a['school'], 'Teacher');
        $substitute = $this->createUser($a['school'], 'Teacher');
        $otherTeacher = $this->createUser($b['school'], 'Teacher');
        $period = TimetablePeriod::create(['school_id' => $a['school']->id, 'name' => 'P1', 'start_time' => '08:00', 'end_time' => '08:40']);
        $entry = TimetableEntry::create([
            'school_id' => $a['school']->id, 'school_class_id' => $a['schoolClass']->id,
            'subject_id' => $a['subject']->id, 'teacher_id' => $regular->id,
            'timetable_period_id' => $period->id, 'academic_year_id' => $a['academicYear']->id, 'day_of_week' => 'monday',
        ]);

        $this->actingAs($owner, 'web')->postJson('/api/school/timetable-substitutions', [
            'timetable_entry_id' => $entry->id, 'substitute_teacher_id' => $substitute->id,
            'date' => '2026-09-07', 'reason' => 'Teacher on leave',
        ])->assertCreated()->assertJsonPath('data.substitute_teacher.id', $substitute->id);

        $this->actingAs($owner, 'web')->postJson('/api/school/timetable-substitutions', [
            'timetable_entry_id' => $entry->id, 'substitute_teacher_id' => $otherTeacher->id, 'date' => '2026-09-14',
        ])->assertUnprocessable()->assertJsonValidationErrors('substitute_teacher_id');
    }
}
