<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class SchoolUserManagementTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_school_owner_cannot_remove_their_own_account(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->deleteJson("/api/school/users/{$owner->id}");

        $response->assertStatus(422);
        $this->assertNotSoftDeleted($owner);
    }

    public function test_a_school_owner_can_remove_another_users_account(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($owner, 'web')->deleteJson("/api/school/users/{$teacher->id}");

        $response->assertNoContent();
        $this->assertSoftDeleted($teacher);
    }
}
