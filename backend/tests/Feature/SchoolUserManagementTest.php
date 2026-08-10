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

    public function test_a_school_with_more_than_the_default_page_size_still_exposes_every_user(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        foreach (range(1, 25) as $i) {
            $this->createUser($school, 'Teacher', ['name' => 'Teacher '.str_pad((string) $i, 2, '0', STR_PAD_LEFT)]);
        }

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/users');

        $response->assertOk();
        $this->assertSame(26, $response->json('meta.total'));
        $this->assertCount(26, $response->json('data'));
    }

    public function test_users_can_be_filtered_by_role(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->createUser($school, 'Teacher', ['name' => 'Amina Teacher']);
        $this->createUser($school, 'Parent', ['name' => 'Bakari Parent']);

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/users?role=Parent');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Bakari Parent'], $names);
    }

    public function test_used_roles_includes_parent_and_teacher_but_is_gated_by_users_manage(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $this->createUser($school, 'Teacher');
        $this->createUser($school, 'Parent');
        $plainTeacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/users/roles');
        $response->assertOk();
        $roles = $response->json('data');
        $this->assertContains('Teacher', $roles);
        $this->assertContains('Parent', $roles);
        $this->assertContains('School Owner', $roles);

        $forbidden = $this->actingAs($plainTeacher, 'web')->getJson('/api/school/users/roles');
        $forbidden->assertForbidden();
    }
}
