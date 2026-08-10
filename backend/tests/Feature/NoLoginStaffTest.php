<?php

namespace Tests\Feature;

use App\Models\StaffProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Support staff (cooks, drivers, gate keepers, general helpers) who'll
 * never sign into the system — a staff_profiles row with no linked user,
 * name/phone stored directly on that row instead of on a User.
 */
class NoLoginStaffTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_staff_profile_can_be_created_with_no_login_at_all(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/staff', [
            'name' => 'Asia Bilal',
            'phone' => '786276496',
            'staff_number' => 'STF-018',
            'job_title' => 'Cook',
            'employment_type' => 'full_time',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Asia Bilal');
        $response->assertJsonPath('data.has_login', false);
        $response->assertJsonPath('data.user_id', null);
        $response->assertJsonPath('data.email', null);
        $response->assertJsonPath('data.roles', []);
        $this->assertDatabaseHas('staff_profiles', ['staff_number' => 'STF-018', 'user_id' => null, 'name' => 'Asia Bilal']);
    }

    public function test_it_rejects_a_staff_profile_with_neither_a_user_nor_a_name(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/staff', [
            'staff_number' => 'STF-099',
            'employment_type' => 'full_time',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('user_id');
    }

    public function test_no_login_and_login_backed_staff_both_appear_in_the_directory_in_name_order(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacherUser = $this->createUser($school, 'Teacher', ['name' => 'Mark Martin']);
        StaffProfile::create([
            'school_id' => $school->id,
            'user_id' => $teacherUser->id,
            'staff_number' => 'STF-003',
            'job_title' => 'Teacher',
        ]);
        StaffProfile::create([
            'school_id' => $school->id,
            'name' => 'Asia Bilal',
            'phone' => '786276496',
            'staff_number' => 'STF-018',
            'job_title' => 'Cook',
        ]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/staff');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Asia Bilal', 'Mark Martin'], $names);
    }

    public function test_search_matches_a_no_login_staff_members_own_name_column(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        StaffProfile::create([
            'school_id' => $school->id,
            'name' => 'Asia Bilal',
            'staff_number' => 'STF-018',
            'job_title' => 'Cook',
        ]);
        StaffProfile::create([
            'school_id' => $school->id,
            'name' => 'Suma Mkude',
            'staff_number' => 'STF-019',
            'job_title' => 'Helper',
        ]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/staff?search=Asia');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Asia Bilal'], $names);
    }

    public function test_subjects_and_classes_cannot_be_assigned_to_a_no_login_staff_member(): void
    {
        $this->seedPermissions();
        $this->seed(\Database\Seeders\Phase3PermissionsSeeder::class);
        $school = $this->createSchool();
        $staff = StaffProfile::create([
            'school_id' => $school->id,
            'name' => 'Asia Bilal',
            'staff_number' => 'STF-018',
            'job_title' => 'Cook',
        ]);
        $owner = $this->createUser($school, 'School Owner');

        $subjectsResponse = $this->actingAs($owner, 'web')
            ->putJson("/api/school/staff/{$staff->id}/subjects", ['subject_ids' => []]);
        $subjectsResponse->assertStatus(422);

        $classesResponse = $this->actingAs($owner, 'web')
            ->putJson("/api/school/staff/{$staff->id}/classes", ['class_ids' => []]);
        $classesResponse->assertStatus(422);
    }

    public function test_updating_a_no_login_staff_members_branch_does_not_require_resending_their_name(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $branch = $this->createBranch($school);
        $staff = StaffProfile::create([
            'school_id' => $school->id,
            'name' => 'Asia Bilal',
            'staff_number' => 'STF-018',
            'job_title' => 'Cook',
        ]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->putJson("/api/school/staff/{$staff->id}", [
            'staff_number' => 'STF-018',
            'branch_id' => $branch->id,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'Asia Bilal');
        $this->assertDatabaseHas('staff_profiles', ['id' => $staff->id, 'name' => 'Asia Bilal', 'branch_id' => $branch->id]);
    }
}
