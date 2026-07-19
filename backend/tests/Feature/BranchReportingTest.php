<?php

namespace Tests\Feature;

use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards multi-branch reporting: branch_id only lives directly on
 * school_classes and staff_profiles (see the migration that added them),
 * so every other branch filter here is really testing that the
 * transitive derivation — student via current enrollment's class, admission
 * via applying_for_class — actually reaches the right rows.
 */
class BranchReportingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_filtering_classes_by_branch_only_returns_that_branchs_classes(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 0);
        $branchA = $this->createBranch($fixture['school'], ['name' => 'Arusha']);
        $branchB = $this->createBranch($fixture['school'], ['name' => 'Moshi']);
        $fixture['schoolClass']->update(['branch_id' => $branchA->id]);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson("/api/school/classes?branch_id={$branchA->id}");

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name');
        $this->assertContains('Form 1', $names);

        $emptyForOtherBranch = $this->actingAs($owner, 'web')->getJson("/api/school/classes?branch_id={$branchB->id}");
        $this->assertCount(0, $emptyForOtherBranch->json('data'));
    }

    public function test_filtering_students_by_branch_follows_their_current_enrollment(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        $branch = $this->createBranch($fixture['school']);
        $fixture['schoolClass']->update(['branch_id' => $branch->id]);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson("/api/school/students?branch_id={$branch->id}");

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $this->assertSame($branch->name, $response->json('data.0.current_enrollment.branch_name'));
    }

    public function test_filtering_staff_by_branch_uses_the_direct_column(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $branch = $this->createBranch($school);
        $otherBranch = $this->createBranch($school);
        $user = User::factory()->create(['school_id' => $school->id]);
        StaffProfile::create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'staff_number' => 'STF-001',
        ]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson("/api/school/staff?branch_id={$branch->id}");
        $this->assertCount(1, $response->json('data'));

        $empty = $this->actingAs($owner, 'web')->getJson("/api/school/staff?branch_id={$otherBranch->id}");
        $this->assertCount(0, $empty->json('data'));
    }

    public function test_a_branch_id_from_another_school_never_leaks_data(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 2);
        $ownBranch = $this->createBranch($fixture['school']);
        $fixture['schoolClass']->update(['branch_id' => $ownBranch->id]);
        $owner = $this->createUser($fixture['school'], 'School Owner');

        $otherSchool = $this->createSchool();
        $foreignBranch = $this->createBranch($otherSchool);

        // A branch id that's real, just not this school's — must behave
        // like "no match", never leak or error.
        $response = $this->actingAs($owner, 'web')->getJson("/api/school/students?branch_id={$foreignBranch->id}");

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_the_branch_comparison_report_reflects_real_counts(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 3);
        $branch = $this->createBranch($fixture['school'], ['name' => 'Arusha']);
        $emptyBranch = $this->createBranch($fixture['school'], ['name' => 'Moshi']);
        $fixture['schoolClass']->update(['branch_id' => $branch->id]);

        $user = User::factory()->create(['school_id' => $fixture['school']->id]);
        StaffProfile::create([
            'school_id' => $fixture['school']->id,
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'staff_number' => 'STF-100',
        ]);

        $owner = $this->createUser($fixture['school'], 'School Owner');
        $response = $this->actingAs($owner, 'web')->getJson('/api/school/analytics/by-branch');

        $response->assertOk();
        $rows = collect($response->json('data'))->keyBy('branch_id');

        $this->assertSame(3, $rows[$branch->id]['student_count']);
        $this->assertSame(1, $rows[$branch->id]['staff_count']);
        $this->assertSame(0, $rows[$emptyBranch->id]['student_count']);
        $this->assertNull($rows[$emptyBranch->id]['attendance_rate']);
    }
}
