<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the teacher-class assignment scoping: a teacher (no classes.manage)
 * should only ever see/act on classes they're actually assigned to — via
 * the explicit class_teacher pivot (User::assignedClasses()) — while a
 * classes.manage holder (School Owner, Principal, Academic Master, etc.)
 * keeps seeing everything, matching the pre-existing behaviour for admins.
 */
class TeacherClassScopingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_teacher_only_sees_their_assigned_classes(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $assignedClass = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 1', 'level' => 1]);
        $otherClass = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 2', 'level' => 2]);
        $teacher = $this->createUser($school, 'Teacher');
        $teacher->assignedClasses()->attach($assignedClass->id);

        $response = $this->actingAs($teacher, 'web')->getJson('/api/school/classes');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($assignedClass->id, $ids);
        $this->assertNotContains($otherClass->id, $ids);
    }

    public function test_a_classes_manage_holder_sees_every_class(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $classA = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 1', 'level' => 1]);
        $classB = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 2', 'level' => 2]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/classes');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($classA->id, $ids);
        $this->assertContains($classB->id, $ids);
    }

    public function test_a_class_teacher_cannot_post_a_class_announcement_for_a_class_they_are_not_assigned_to(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $school = $this->createSchool();
        $unassignedClass = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 1', 'level' => 1]);
        $classTeacher = $this->createUser($school, 'Class Teacher');

        $response = $this->actingAs($classTeacher, 'web')->postJson('/api/school/announcements', [
            'title' => 'Reminder',
            'body' => 'Bring your books tomorrow.',
            'audience' => 'class',
            'school_class_id' => $unassignedClass->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('school_class_id');
    }

    public function test_a_class_teacher_can_post_a_class_announcement_for_their_own_class(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $school = $this->createSchool();
        $ownClass = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 1', 'level' => 1]);
        $classTeacher = $this->createUser($school, 'Class Teacher');
        $classTeacher->assignedClasses()->attach($ownClass->id);

        $response = $this->actingAs($classTeacher, 'web')->postJson('/api/school/announcements', [
            'title' => 'Reminder',
            'body' => 'Bring your books tomorrow.',
            'audience' => 'class',
            'school_class_id' => $ownClass->id,
        ]);

        $response->assertCreated();
    }
}
