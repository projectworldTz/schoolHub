<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * A Super Admin has no school_id of their own, so without explicitly
 * "entering" a school (App\Http\Controllers\Platform\SchoolController::
 * enter()/exitSchool()), every school/* route denies them by default (see
 * App\Models\Concerns\BelongsToSchool). This covers that entering a school
 * grants scoped access to it — and only it — and that a Super Admin's own
 * account never shows up in that school's own user list.
 */
class PlatformSchoolImpersonationTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_super_admin_can_enter_a_school_and_see_only_that_schools_users(): void
    {
        $this->seedPermissions();

        $schoolA = $this->createSchool();
        $ownerA = $this->createUser($schoolA, 'School Owner', ['email' => 'ownera@riverside.test']);

        $schoolB = $this->createSchool();
        $this->createUser($schoolB, 'School Owner', ['email' => 'ownerb@sunrise.test']);

        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $enter = $this->withHeader('Referer', 'http://localhost:5173')
            ->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$schoolA->id}/enter");
        $enter->assertNoContent();

        $me = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/auth/me');
        $me->assertOk();
        $me->assertJsonPath('data.acting_school.id', $schoolA->id);

        $users = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/school/users');
        $users->assertOk();
        $emails = collect($users->json('data'))->pluck('email');

        $this->assertContains('ownera@riverside.test', $emails);
        $this->assertNotContains('ownerb@sunrise.test', $emails);
        // The Super Admin's own account (school_id points at their dummy
        // fixture school, not School A) must never appear in School A's list.
        $this->assertNotContains($superAdmin->email, $emails);
    }

    public function test_exiting_a_school_clears_the_acting_school(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $this->withHeader('Referer', 'http://localhost:5173')
            ->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$school->id}/enter")
            ->assertNoContent();

        $exit = $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/platform/exit-school');
        $exit->assertNoContent();

        $me = $this->withHeader('Referer', 'http://localhost:5173')->getJson('/api/auth/me');
        $me->assertOk();
        $me->assertJsonPath('data.acting_school', null);
    }

    public function test_a_non_super_admin_cannot_enter_a_school(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $otherSchool = $this->createSchool();

        $response = $this->withHeader('Referer', 'http://localhost:5173')
            ->actingAs($owner, 'web')
            ->postJson("/api/platform/schools/{$otherSchool->id}/enter");

        $response->assertForbidden();
    }

    /**
     * Regression test for a subtler bug the impersonation feature exposed:
     * every write endpoint that references another school-scoped record
     * (a class, a department, a branch...) validated against
     * $request->user()->school_id, which is always NULL for a Super Admin.
     * That silently 422'd (or, for SchoolUserController::store, silently
     * saved under the wrong school) while impersonating, even though the
     * Super Admin has every permission needed. Fixed by scoping those
     * checks to App\Support\Tenancy\Tenant::id() instead — this exercises
     * that fix across a student create+enroll and a new staff account.
     */
    public function test_a_super_admin_can_create_data_while_impersonating_a_school(): void
    {
        $this->seedPermissions();

        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $school = $fixture['school'];
        $superAdmin = $this->createUser($this->createSchool(['type' => 'primary']), 'Super Admin');

        $this->withHeader('Referer', 'http://localhost:5173')
            ->actingAs($superAdmin, 'web')
            ->postJson("/api/platform/schools/{$school->id}/enter")
            ->assertNoContent();

        $student = $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/school/students', [
            'admission_number' => 'ADM-100',
            'first_name' => 'Amina',
            'last_name' => 'Test',
        ]);
        $student->assertCreated();
        $this->assertDatabaseHas('students', [
            'id' => $student->json('data.id'),
            'school_id' => $school->id,
        ]);

        $enroll = $this->withHeader('Referer', 'http://localhost:5173')->postJson(
            "/api/school/students/{$student->json('data.id')}/enrollments",
            [
                'academic_year_id' => $fixture['academicYear']->id,
                'school_class_id' => $fixture['schoolClass']->id,
                'enrolled_at' => '2026-01-15',
            ]
        );
        $enroll->assertCreated();

        // 'Accountant' is in the shared catalog (config/school_roles.php),
        // valid regardless of $school's type — the fixture school's type
        // doesn't matter for what this test is actually checking (that the
        // new account lands under Tenant::id(), not the Super Admin's own
        // school_id).
        $newStaff = $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/school/users', [
            'name' => 'New Accountant',
            'email' => 'newaccountant@riverside.test',
            'password' => 'a-strong-password-1',
            'roles' => ['Accountant'],
        ]);
        $newStaff->assertCreated();
        $newStaff->assertJsonPath('data.school_id', $school->id);
    }
}
