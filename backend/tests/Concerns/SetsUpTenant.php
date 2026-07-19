<?php

namespace Tests\Concerns;

use App\Models\AcademicYear;
use App\Models\Branch;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubject;
use App\Models\GradingSystem;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\Phase1PermissionsSeeder;
use Database\Seeders\Phase2PermissionsSeeder;
use Database\Seeders\Phase4PermissionsSeeder;
use Database\Seeders\Phase5PermissionsSeeder;
use Database\Seeders\Phase7PermissionsSeeder;
use Database\Seeders\Phase8PermissionsSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Str;

/**
 * A reusable "one real school, fully wired" fixture builder. Every model
 * created here passes school_id explicitly, so none of it needs to run
 * inside a Tenant context — BelongsToSchool's creating() hook only fills
 * school_id in when it's missing (see App\Models\Concerns\BelongsToSchool).
 * Reads (e.g. GradingSystem::where('is_default', true)) DO need a tenant
 * context, which is why feature tests in this suite drive everything
 * through real HTTP calls with actingAs() — ResolveTenantFromUser sets
 * that up the same way a real request would, so no manual Tenant::set()
 * plumbing is needed in the tests themselves.
 */
trait SetsUpTenant
{
    protected function seedPermissions(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(Phase1PermissionsSeeder::class);
        $this->seed(Phase2PermissionsSeeder::class);
        $this->seed(Phase4PermissionsSeeder::class);
        $this->seed(Phase5PermissionsSeeder::class);
        $this->seed(Phase7PermissionsSeeder::class);
        $this->seed(Phase8PermissionsSeeder::class);
    }

    protected function createSchool(array $attributes = []): School
    {
        return School::create(array_merge([
            'name' => 'Test School '.Str::random(6),
            'slug' => 'test-school-'.Str::lower(Str::random(8)),
            'status' => 'approved',
        ], $attributes));
    }

    protected function createBranch(School $school, array $attributes = []): Branch
    {
        return Branch::create(array_merge([
            'school_id' => $school->id,
            'name' => 'Branch '.Str::random(6),
        ], $attributes));
    }

    protected function createUser(School $school, string $role, array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'school_id' => $school->id,
            'is_active' => true,
        ], $attributes));
        $user->assignRole($role);

        return $user;
    }

    /**
     * One school with a class, a subject, a default grading system
     * (A/B/C/D/F over 0-100, each with a remark), an academic year, and a
     * given number of students actively enrolled in that class — the
     * baseline every exam/ranking/report-card test builds on.
     */
    protected function setUpSchoolWithClass(int $studentCount = 4): array
    {
        $school = $this->createSchool();

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2026/2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $schoolClass = SchoolClass::create([
            'school_id' => $school->id,
            'name' => 'Form 1',
            'level' => 1,
        ]);

        $subject = Subject::create([
            'school_id' => $school->id,
            'name' => 'Mathematics',
            'code' => 'MATH',
        ]);

        $gradingSystem = GradingSystem::create([
            'school_id' => $school->id,
            'name' => 'Default Scale',
            'is_default' => true,
        ]);
        $gradingSystem->gradeBands()->createMany([
            ['label' => 'A', 'min_score' => 80, 'max_score' => 100, 'remark' => 'Excellent'],
            ['label' => 'B', 'min_score' => 65, 'max_score' => 79, 'remark' => 'Good'],
            ['label' => 'C', 'min_score' => 50, 'max_score' => 64, 'remark' => 'Average'],
            ['label' => 'D', 'min_score' => 40, 'max_score' => 49, 'remark' => 'Needs improvement'],
            ['label' => 'F', 'min_score' => 0, 'max_score' => 39, 'remark' => 'Fail'],
        ]);

        $students = collect(range(1, $studentCount))->map(function (int $i) use ($school, $academicYear, $schoolClass) {
            $student = Student::create([
                'school_id' => $school->id,
                'admission_number' => 'ADM-'.Str::padLeft((string) $i, 3, '0'),
                'first_name' => "Student{$i}",
                'last_name' => 'Test',
                'status' => 'active',
            ]);

            StudentEnrollment::create([
                'school_id' => $school->id,
                'student_id' => $student->id,
                'academic_year_id' => $academicYear->id,
                'school_class_id' => $schoolClass->id,
                'status' => 'active',
                'enrolled_at' => '2026-01-15',
            ]);

            return $student;
        });

        return compact('school', 'academicYear', 'schoolClass', 'subject', 'gradingSystem', 'students');
    }

    protected function createExamWithSubject(School $school, AcademicYear $academicYear, SchoolClass $schoolClass, Subject $subject, string $status = 'completed'): array
    {
        $exam = Exam::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'name' => 'Midterm',
            'exam_type' => 'midterm',
            'start_date' => '2026-06-01',
            'status' => $status,
        ]);

        $examSubject = ExamSubject::create([
            'school_id' => $school->id,
            'exam_id' => $exam->id,
            'school_class_id' => $schoolClass->id,
            'subject_id' => $subject->id,
            'max_marks' => 100,
            'pass_marks' => 40,
        ]);

        return compact('exam', 'examSubject');
    }

    protected function recordMark(School $school, ExamSubject $examSubject, Student $student, ?float $marks, ?string $grade = null): ExamResult
    {
        return ExamResult::create([
            'school_id' => $school->id,
            'exam_subject_id' => $examSubject->id,
            'student_id' => $student->id,
            'marks_obtained' => $marks,
            'grade' => $grade,
        ]);
    }
}
