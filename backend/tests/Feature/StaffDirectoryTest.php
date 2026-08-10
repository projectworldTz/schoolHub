<?php

namespace Tests\Feature;

use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards against the "some staff never show up" bug: StaffProfileController
 * ::index() used to paginate at 20 with no ORDER BY, so a school with more
 * staff than one page got an arbitrary, unstable slice. Ordering by the
 * related user's name requires a join (name isn't a staff_profiles column),
 * which is easy to get wrong (e.g. an ambiguous school_id after joining
 * users, which also has a school_id column) — these tests exercise the
 * real query end-to-end rather than just asserting on Eloquent in isolation.
 */
class StaffDirectoryTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function createStaff(\App\Models\School $school, string $name, string $staffNumber): StaffProfile
    {
        $user = $this->createUser($school, 'Teacher', ['name' => $name]);

        return StaffProfile::create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'staff_number' => $staffNumber,
            'job_title' => 'Teacher',
        ]);
    }

    public function test_every_staff_member_is_returned_across_pages_in_name_order(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createStaff($school, 'Zoe Adams', 'S-001');
        $this->createStaff($school, 'Amina Bakari', 'S-002');
        $this->createStaff($school, 'Mike Chen', 'S-003');
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/staff?per_page=2');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Amina Bakari', 'Mike Chen'], $names);
        $this->assertSame(3, $response->json('meta.total'));
        $this->assertSame(2, $response->json('meta.last_page'));
    }

    public function test_a_school_with_more_than_the_default_page_size_still_exposes_every_staff_member(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        foreach (range(1, 25) as $i) {
            $this->createStaff($school, 'Staff '.str_pad((string) $i, 2, '0', STR_PAD_LEFT), 'S-'.$i);
        }
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/staff');

        $response->assertOk();
        $this->assertSame(25, $response->json('meta.total'));
        $this->assertCount(25, $response->json('data'));
    }

    public function test_search_still_filters_by_the_related_users_name(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $this->createStaff($school, 'Amina Bakari', 'S-001');
        $this->createStaff($school, 'Mike Chen', 'S-002');
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/staff?search=Amina');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Amina Bakari'], $names);
    }

    public function test_staff_from_another_school_never_leak_into_the_directory(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $otherSchool = $this->createSchool();
        $this->createStaff($school, 'Amina Bakari', 'S-001');
        $this->createStaff($otherSchool, 'Someone Else', 'S-999');
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/staff');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(['Amina Bakari'], $names);
    }
}
