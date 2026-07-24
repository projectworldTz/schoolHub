<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the attendance trend feature: a class teacher or Academic Master
 * can trace one student's attendance pattern (not just today's register),
 * and the monthly rate trend used to drive the line graph is computed
 * correctly. Same trend logic backs the Parent Portal view.
 */
class AttendanceTrendTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_class_teacher_can_view_a_students_attendance_history_and_trend(): void
    {
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class);
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();

        AttendanceRecord::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $student->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'date' => '2026-01-05',
            'status' => 'present',
        ]);
        AttendanceRecord::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $student->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'date' => '2026-01-06',
            'status' => 'absent',
        ]);
        AttendanceRecord::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $student->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'date' => '2026-02-10',
            'status' => 'present',
        ]);

        $classTeacher = $this->createUser($fixture['school'], 'Class Teacher');

        $response = $this->actingAs($classTeacher, 'web')->getJson("/api/school/students/{$student->id}/attendance");

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));

        $trend = $response->json('meta.trend');
        $this->assertCount(2, $trend);
        $this->assertSame('2026-01', $trend[0]['period']);
        $this->assertSame(1, $trend[0]['present']);
        $this->assertSame(1, $trend[0]['absent']);
        $this->assertEquals(50.0, $trend[0]['rate']);
        $this->assertSame('2026-02', $trend[1]['period']);
        $this->assertEquals(100.0, $trend[1]['rate']);
    }

    public function test_a_teacher_without_attendance_or_student_permission_cannot_view_history(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();

        $parent = $this->createUser($fixture['school'], 'Parent');

        $response = $this->actingAs($parent, 'web')->getJson("/api/school/students/{$student->id}/attendance");

        $response->assertForbidden();
    }

    public function test_a_parent_sees_their_own_childs_attendance_trend(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $student = $fixture['students']->first();

        AttendanceRecord::create([
            'school_id' => $fixture['school']->id,
            'student_id' => $student->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'academic_year_id' => $fixture['academicYear']->id,
            'date' => '2026-01-05',
            'status' => 'present',
        ]);

        $guardian = \App\Models\Guardian::create([
            'school_id' => $fixture['school']->id,
            'name' => 'Test Guardian',
        ]);
        $guardian->students()->attach($student->id, ['relationship' => 'mother', 'is_primary' => true]);
        $parentUser = $this->createUser($fixture['school'], 'Parent');
        $guardian->update(['user_id' => $parentUser->id]);

        $response = $this->actingAs($parentUser, 'web')->getJson("/api/parent/children/{$student->id}/attendance");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('2026-01', $response->json('meta.trend.0.period'));
        $this->assertEquals(100.0, $response->json('meta.trend.0.rate'));
    }
}
