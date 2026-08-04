<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * A student's printed/ID-card QR code (Student::$qr_code) resolves through
 * ParentPortalController::scan() to that student's info — but only for a
 * parent who is actually linked to them. This is the same isolation
 * TenantIsolationTest guards for every other student-scoped endpoint,
 * applied to a route that's reached by a QR code rather than a route-bound
 * {student}, so it gets its own coverage.
 */
class ParentQrScanTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function linkParent(School $school, Student $student): User
    {
        $guardian = Guardian::create(['school_id' => $school->id, 'name' => 'Test Guardian']);
        $guardian->students()->attach($student->id, ['relationship' => 'mother', 'is_primary' => true]);
        $parentUser = $this->createUser($school, 'Parent');
        $guardian->update(['user_id' => $parentUser->id]);

        return $parentUser;
    }

    public function test_a_parent_can_scan_their_own_childs_qr_code(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();
        $parent = $this->linkParent($fixture['school'], $student);

        $response = $this->actingAs($parent, 'web')->getJson("/api/parent/scan/{$student->qr_code}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $student->id);
    }

    public function test_a_parent_cannot_scan_a_child_that_isnt_theirs(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        [$ownChild, $otherChild] = $fixture['students']->all();
        $parent = $this->linkParent($fixture['school'], $ownChild);

        $response = $this->actingAs($parent, 'web')->getJson("/api/parent/scan/{$otherChild->qr_code}");

        $response->assertForbidden();
    }

    public function test_scanning_an_unknown_qr_code_404s(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $parent = $this->linkParent($fixture['school'], $fixture['students']->first());

        $response = $this->actingAs($parent, 'web')->getJson('/api/parent/scan/not-a-real-code');

        $response->assertNotFound();
    }

    public function test_a_parent_cannot_scan_a_students_qr_code_from_another_school(): void
    {
        $this->seedPermissions();
        $schoolA = $this->setUpSchoolWithClass(studentCount: 1);
        $schoolB = $this->setUpSchoolWithClass(studentCount: 1);
        $parentA = $this->linkParent($schoolA['school'], $schoolA['students']->first());
        $otherSchoolsStudent = $schoolB['students']->first();

        $response = $this->actingAs($parentA, 'web')->getJson("/api/parent/scan/{$otherSchoolsStudent->qr_code}");

        $response->assertNotFound();
    }

    public function test_a_non_parent_cannot_use_the_scan_endpoint(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson("/api/parent/scan/{$student->qr_code}");

        $response->assertForbidden();
    }
}
