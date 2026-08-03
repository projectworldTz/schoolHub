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
}
