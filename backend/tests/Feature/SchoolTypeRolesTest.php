<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Roles are global Spatie rows shared by every school (see
 * App\Support\Tenancy\Tenant on why there's no per-tenant "teams" split),
 * but which of them a school is actually offered depends on its type
 * (config/school_roles.php, App\Support\SchoolRoles) — a university
 * shouldn't be handed "Class Teacher", and a primary school shouldn't be
 * handed "Vice Chancellor".
 */
class SchoolTypeRolesTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_primary_schools_available_roles_are_primary_appropriate(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/roles');

        $response->assertOk();
        $roles = $response->json('data');

        $this->assertContains('Head Teacher', $roles);
        $this->assertContains('Discipline Master', $roles);
        $this->assertContains('Subject Teacher', $roles);
        $this->assertContains('Class Teacher', $roles);
        $this->assertContains('Accountant', $roles, 'shared operational roles must still appear');

        $this->assertNotContains('Vice Chancellor', $roles);
        $this->assertNotContains('Lecturer', $roles);
        $this->assertNotContains('Principal', $roles);
        $this->assertNotContains('Super Admin', $roles);
    }

    public function test_a_universitys_available_roles_are_university_appropriate(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool(['type' => 'university']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/roles');

        $response->assertOk();
        $roles = $response->json('data');

        $this->assertContains('Vice Chancellor', $roles);
        $this->assertContains('Dean of Students', $roles);
        $this->assertContains('Lecturer', $roles);
        $this->assertContains('Head of Department', $roles);

        $this->assertNotContains('Head Teacher', $roles);
        $this->assertNotContains('Class Teacher', $roles);
        $this->assertNotContains('Discipline Master', $roles);
    }

    public function test_a_primary_school_cannot_assign_a_university_only_role(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'Someone',
            'email' => 'someone@primary.test',
            'password' => 'correct-horse-battery',
            'roles' => ['Vice Chancellor'],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('roles.0');
    }

    public function test_a_primary_school_can_assign_its_discipline_master_role_with_the_right_permission(): void
    {
        $this->seedPermissions();

        $school = $this->createSchool(['type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/users', [
            'name' => 'Discipline Person',
            'email' => 'discipline@primary.test',
            'password' => 'correct-horse-battery',
            'roles' => ['Discipline Master'],
        ]);

        $response->assertCreated();

        $created = \App\Models\User::withoutGlobalScopes()->where('email', 'discipline@primary.test')->firstOrFail();
        $this->assertTrue($created->hasRole('Discipline Master'));
        $this->assertTrue($created->can('discipline.manage'));
    }
}
