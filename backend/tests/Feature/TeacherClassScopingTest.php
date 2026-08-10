<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the teacher-class assignment scoping: it applies to WRITE paths
 * that need per-user class authorization (announcements, exam marks — via
 * User::canAccessClass()), not to the shared read-only GET /school/classes
 * listing, which every class-picking <Select> in the app relies on and must
 * return every class in the school regardless of the viewer's own
 * class_teacher/homeroom assignments (see SchoolClassController::index()'s
 * docblock for why: a Bursar or subject teacher with no assignment of their
 * own still needs to see every class).
 */
class TeacherClassScopingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_teacher_with_no_class_assignment_still_sees_every_class(): void
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
        $this->assertContains($otherClass->id, $ids);
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
