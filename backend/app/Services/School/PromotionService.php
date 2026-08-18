<?php

namespace App\Services\School;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentPromotion;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Annual (or manual, per-class) student promotion: moves every actively
 * enrolled student in a class to that class's "next" class for a new
 * academic year, leaving the old academic year's enrollment row untouched
 * (student_enrollments is already one row per student per academic year —
 * that IS the class-history table, so promotion only ever adds a row,
 * never mutates one). A class at the top of its school's own progression
 * (no higher `level` configured) graduates its students instead, reusing
 * Student::status / student_status_changes exactly the way
 * GraduationController::batch() already does.
 *
 * "Next class" and "top of the progression" are both derived purely from
 * school_classes.level/auto_promote — never a hardcoded class name — so
 * this works the same for a Standard 1-7 primary school as it would for a
 * Form 1-6 secondary one.
 *
 * Same preview/commit split as StudentImportService: preview() never
 * writes, commit() takes the admin's reviewed (and possibly edited)
 * decision list. A student already actively enrolled in the target
 * academic year is skipped rather than re-promoted — what makes re-running
 * commit() for the same academic-year transition safe.
 */
class PromotionService
{
    public function preview(?string $fromAcademicYearId, ?string $toAcademicYearId): array
    {
        $toAcademicYear = $toAcademicYearId
            ? AcademicYear::find($toAcademicYearId)
            : $this->resolveCurrentAcademicYear();

        $fromAcademicYear = $fromAcademicYearId
            ? AcademicYear::find($fromAcademicYearId)
            : ($toAcademicYear ? $this->resolvePreviousAcademicYear($toAcademicYear) : null);

        if (! $toAcademicYear || ! $fromAcademicYear) {
            return [
                'from_academic_year' => $this->academicYearSummary($fromAcademicYear),
                'to_academic_year' => $this->academicYearSummary($toAcademicYear),
                'classes' => [],
                'manual_classes' => [],
            ];
        }

        $classes = SchoolClass::orderBy('level')->get();
        $nextClassByClassId = $this->resolveNextClasses($classes);

        $autoClasses = [];
        $manualClasses = [];

        foreach ($classes as $class) {
            $enrollments = StudentEnrollment::query()
                ->with('student')
                ->where('academic_year_id', $fromAcademicYear->id)
                ->where('school_class_id', $class->id)
                ->where('status', 'active')
                ->get();

            if ($enrollments->isEmpty()) {
                continue;
            }

            if (! $class->auto_promote) {
                $manualClasses[] = [
                    'school_class_id' => $class->id,
                    'school_class_name' => $class->name,
                    'student_count' => $enrollments->count(),
                ];

                continue;
            }

            $alreadyPromotedStudentIds = StudentEnrollment::where('academic_year_id', $toAcademicYear->id)
                ->where('status', 'active')
                ->whereIn('student_id', $enrollments->pluck('student_id'))
                ->pluck('student_id')
                ->all();

            /** @var SchoolClass|null $nextClass */
            $nextClass = $nextClassByClassId[$class->id] ?? null;

            $autoClasses[] = [
                'from_school_class_id' => $class->id,
                'from_school_class_name' => $class->name,
                'to_school_class_id' => $nextClass?->id,
                'to_school_class_name' => $nextClass?->name,
                'is_terminal' => $nextClass === null,
                'students' => $enrollments->map(fn (StudentEnrollment $enrollment) => [
                    'student_id' => $enrollment->student_id,
                    'name' => $enrollment->student->full_name,
                    'admission_number' => $enrollment->student->admission_number,
                    'already_promoted' => in_array($enrollment->student_id, $alreadyPromotedStudentIds, true),
                ])->values(),
            ];
        }

        return [
            'from_academic_year' => $this->academicYearSummary($fromAcademicYear),
            'to_academic_year' => $this->academicYearSummary($toAcademicYear),
            'classes' => $autoClasses,
            'manual_classes' => $manualClasses,
        ];
    }

    /**
     * @param  array<int, array{student_id: string, to_school_class_id?: ?string, graduate?: bool}>  $decisions
     */
    public function commit(
        ?string $fromAcademicYearId,
        string $toAcademicYearId,
        array $decisions,
        string $mode,
        ?User $confirmedBy
    ): array {
        $toAcademicYear = AcademicYear::findOrFail($toAcademicYearId);
        $fromAcademicYear = $fromAcademicYearId ? AcademicYear::find($fromAcademicYearId) : null;

        $results = array_map(
            fn (array $decision) => $this->applyDecision($decision, $fromAcademicYear, $toAcademicYear, $mode, $confirmedBy),
            $decisions
        );

        return [
            'total' => count($results),
            'promoted_count' => count(array_filter($results, fn ($r) => $r['status'] === 'promoted')),
            'repeated_count' => count(array_filter($results, fn ($r) => $r['status'] === 'repeated')),
            'graduated_count' => count(array_filter($results, fn ($r) => $r['status'] === 'graduated')),
            'skipped_count' => count(array_filter($results, fn ($r) => $r['status'] === 'skipped')),
            'results' => $results,
        ];
    }

    protected function applyDecision(
        array $decision,
        ?AcademicYear $fromAcademicYear,
        AcademicYear $toAcademicYear,
        string $mode,
        ?User $confirmedBy
    ): array {
        $student = Student::find($decision['student_id'] ?? null);
        if (! $student) {
            return ['student_id' => $decision['student_id'] ?? null, 'status' => 'error', 'message' => 'Student not found.'];
        }

        // Idempotency: a student already actively enrolled for the target
        // academic year has already been promoted (this run or a previous
        // one) — never touched twice.
        $alreadyEnrolled = StudentEnrollment::where('student_id', $student->id)
            ->where('academic_year_id', $toAcademicYear->id)
            ->where('status', 'active')
            ->exists();

        if ($alreadyEnrolled) {
            return ['student_id' => $student->id, 'status' => 'skipped', 'message' => 'Already promoted for this academic year.'];
        }

        return DB::transaction(function () use ($student, $decision, $fromAcademicYear, $toAcademicYear, $mode, $confirmedBy) {
            $fromEnrollment = $fromAcademicYear
                ? StudentEnrollment::where('student_id', $student->id)
                    ->where('academic_year_id', $fromAcademicYear->id)
                    ->where('status', 'active')
                    ->first()
                : null;

            $fromClassId = $fromEnrollment?->school_class_id;

            if (! empty($decision['graduate'])) {
                $student->update(['status' => 'graduated']);
                $fromEnrollment?->update(['status' => 'graduated']);

                StudentPromotion::create([
                    'student_id' => $student->id,
                    'from_academic_year_id' => $fromAcademicYear?->id,
                    'to_academic_year_id' => $toAcademicYear->id,
                    'from_school_class_id' => $fromClassId,
                    'to_school_class_id' => null,
                    'action' => 'graduated',
                    'mode' => $mode,
                    'promoted_by' => $confirmedBy?->id,
                    'promoted_at' => now(),
                ]);

                return ['student_id' => $student->id, 'status' => 'graduated'];
            }

            $toClassId = $decision['to_school_class_id'];

            StudentEnrollment::create([
                'student_id' => $student->id,
                'academic_year_id' => $toAcademicYear->id,
                'school_class_id' => $toClassId,
                'status' => 'active',
                'enrolled_at' => now()->toDateString(),
            ]);

            $action = ($fromClassId !== null && $fromClassId === $toClassId) ? 'repeated' : 'promoted';

            StudentPromotion::create([
                'student_id' => $student->id,
                'from_academic_year_id' => $fromAcademicYear?->id,
                'to_academic_year_id' => $toAcademicYear->id,
                'from_school_class_id' => $fromClassId,
                'to_school_class_id' => $toClassId,
                'action' => $action,
                'mode' => $mode,
                'promoted_by' => $confirmedBy?->id,
                'promoted_at' => now(),
            ]);

            return ['student_id' => $student->id, 'status' => $action];
        });
    }

    /**
     * @param  Collection<int, SchoolClass>  $classesOrderedByLevel
     * @return array<string, SchoolClass|null>
     */
    protected function resolveNextClasses(Collection $classesOrderedByLevel): array
    {
        $ordered = $classesOrderedByLevel->values();
        $next = [];

        foreach ($ordered as $index => $class) {
            $next[$class->id] = $ordered->get($index + 1);
        }

        return $next;
    }

    protected function resolvePreviousAcademicYear(AcademicYear $toAcademicYear): ?AcademicYear
    {
        return AcademicYear::where('start_date', '<', $toAcademicYear->start_date)
            ->orderByDesc('start_date')
            ->first();
    }

    protected function resolveCurrentAcademicYear(): ?AcademicYear
    {
        return AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::orderByDesc('start_date')->first();
    }

    protected function academicYearSummary(?AcademicYear $academicYear): ?array
    {
        if (! $academicYear) {
            return null;
        }

        return ['id' => $academicYear->id, 'name' => $academicYear->name];
    }
}
