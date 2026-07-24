<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the Super Admin's platform dashboard: totals must count real users
 * per school (via Tenant::runAsPlatform, since `users` is otherwise
 * tenant-scoped to nothing for a Super Admin), and the activity feed must
 * merge every school's ActivityLog rows rather than being scoped to one.
 */
class PlatformDashboardTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_super_admin_sees_platform_wide_totals_and_activity(): void
    {
        $this->seedPermissions();

        $schoolA = $this->createSchool(['status' => 'approved']);
        $schoolB = $this->createSchool(['status' => 'pending']);
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');

        $ownerA = $this->createUser($schoolA, 'School Owner');
        $this->createUser($schoolA, 'Teacher');
        $this->createUser($schoolB, 'School Owner');

        $category = ExpenseCategory::create(['school_id' => $schoolA->id, 'name' => 'Fuel']);
        Expense::create([
            'school_id' => $schoolA->id,
            'expense_category_id' => $category->id,
            'amount' => 50000,
            'description' => 'Diesel',
            'expense_date' => '2026-07-18',
            'recorded_by' => $ownerA->id,
        ]);

        $response = $this->actingAs($superAdmin, 'web')->getJson('/api/platform/dashboard');

        $response->assertOk();
        $this->assertSame(3, $response->json('data.stats.schools_total'));
        $this->assertSame(1, $response->json('data.stats.schools_pending'));
        // 1 (superAdmin's own school, ownerless) + 2 (school A: owner + teacher) + 1 (school B: owner) = 4
        $this->assertSame(4, $response->json('data.stats.users_total'));

        $schoolNames = collect($response->json('data.recent_schools'))->pluck('name');
        $this->assertTrue($schoolNames->contains($schoolA->name));
        $this->assertTrue($schoolNames->contains($schoolB->name));

        $activityDescriptions = collect($response->json('data.recent_activity'))->pluck('description');
        $this->assertTrue($activityDescriptions->contains(fn ($d) => str_contains($d, 'Diesel')));
    }

    public function test_a_non_super_admin_cannot_view_the_platform_dashboard(): void
    {
        $this->seedPermissions();
        $owner = $this->createUser($this->createSchool(), 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/platform/dashboard');

        $response->assertForbidden();
    }
}
