<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Beyond approve/suspend/renew-license, a Super Admin can also edit a
 * school's own details directly, and needs a quick read on how much is
 * actually happening inside it (students/teachers/parents) without having
 * to log into that school itself.
 */
class PlatformSchoolManagementTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_super_admin_can_edit_a_schools_details(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool(['name' => 'Old Name', 'city' => 'Old City']);

        $response = $this->actingAs($superAdmin, 'web')->putJson("/api/platform/schools/{$school->id}", [
            'name' => 'New Name',
            'city' => 'New City',
            'subscription_plan' => 'Premium',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'New Name');
        $response->assertJsonPath('data.city', 'New City');
        $response->assertJsonPath('data.subscription_plan', 'Premium');
    }

    public function test_a_non_super_admin_cannot_edit_a_school(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->putJson("/api/platform/schools/{$school->id}", [
            'name' => 'Hijacked Name',
        ]);

        $response->assertForbidden();
    }

    public function test_the_schools_list_reports_student_teacher_and_parent_counts(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool();

        Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-1',
            'first_name' => 'A',
            'last_name' => 'Student',
            'status' => 'active',
        ]);
        Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-2',
            'first_name' => 'Another',
            'last_name' => 'Student',
            'status' => 'active',
        ]);

        $this->createUser($school, 'Teacher');
        $this->createUser($school, 'Class Teacher');
        // A non-teaching staff role must not be counted as a teacher.
        $this->createUser($school, 'Accountant');

        Guardian::create(['school_id' => $school->id, 'name' => 'Guardian One']);
        Guardian::create(['school_id' => $school->id, 'name' => 'Guardian Two']);

        $index = $this->actingAs($superAdmin, 'web')->getJson('/api/platform/schools');
        $index->assertOk();
        $listed = collect($index->json('data'))->firstWhere('id', $school->id);
        $this->assertSame(2, $listed['students_count']);
        $this->assertSame(2, $listed['teachers_count']);
        $this->assertSame(2, $listed['parents_count']);

        $show = $this->actingAs($superAdmin, 'web')->getJson("/api/platform/schools/{$school->id}");
        $show->assertOk();
        $show->assertJsonPath('data.students_count', 2);
        $show->assertJsonPath('data.teachers_count', 2);
        $show->assertJsonPath('data.parents_count', 2);
    }
}
