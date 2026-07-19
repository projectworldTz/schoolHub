<?php

namespace App\Services\School;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubject;
use App\Models\GradeBand;
use App\Models\GradingSystem;
use App\Models\StudentEnrollment;
use App\Models\TimetableEntry;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ExamService
{
    /**
     * A result row is created up front for every actively-enrolled student
     * in the subject's class — same "stub row, null means not yet marked"
     * pattern as homework_submissions.
     */
    public function addSubject(Exam $exam, array $attributes): ExamSubject
    {
        return DB::transaction(function () use ($exam, $attributes) {
            $examSubject = $exam->examSubjects()->create($attributes);

            $studentIds = StudentEnrollment::query()
                ->where('academic_year_id', $exam->academic_year_id)
                ->where('school_class_id', $attributes['school_class_id'])
                ->where('status', 'active')
                ->pluck('student_id');

            foreach ($studentIds as $studentId) {
                ExamResult::create([
                    'exam_subject_id' => $examSubject->id,
                    'student_id' => $studentId,
                ]);
            }

            return $examSubject;
        });
    }

    public function recordMarks(ExamResult $result, ?float $marksObtained, ?string $remarks, string $enteredBy): ExamResult
    {
        $result->update([
            'marks_obtained' => $marksObtained,
            'grade' => $marksObtained !== null ? $this->computeGrade($result->examSubject, $marksObtained) : null,
            'remarks' => $remarks,
            'entered_by' => $enteredBy,
        ]);

        return $result;
    }

    /**
     * Grades come from the school's default grading system's bands, keyed
     * off percentage (marks_obtained / max_marks), not raw marks — so a
     * 45/50 exam and a 90/100 exam grade consistently.
     */
    public function computeGrade(ExamSubject $examSubject, float $marksObtained): ?string
    {
        $gradingSystem = GradingSystem::where('is_default', true)->first();
        if (! $gradingSystem) {
            return null;
        }

        $maxMarks = (float) $examSubject->max_marks;
        $percentage = $maxMarks > 0 ? ($marksObtained / $maxMarks) * 100 : 0;

        $band = $gradingSystem->gradeBands()
            ->where('min_score', '<=', $percentage)
            ->where('max_score', '>=', $percentage)
            ->first();

        return $band?->label;
    }

    public function gradeForPercentage(float $percentage): ?string
    {
        return $this->gradeBandForPercentage($percentage)?->label;
    }

    /**
     * Both the letter grade and the school-configured remark for that band
     * ("Excellent", "Fail", ...) — PerformanceMessageService uses the
     * remark to pick its tone before falling back to raw percentage
     * thresholds, so callers that need a parent-facing message should use
     * this instead of gradeForPercentage() alone.
     */
    public function gradeBandForPercentage(float $percentage): ?GradeBand
    {
        $gradingSystem = GradingSystem::where('is_default', true)->first();

        return $gradingSystem?->gradeBands()
            ->where('min_score', '<=', $percentage)
            ->where('max_score', '>=', $percentage)
            ->first();
    }

    /**
     * Ranks every student in a class for an exam by the average of their
     * per-subject percentages — the same "average of percentages, not sum
     * of raw marks" convention AnalyticsController::academics() already
     * uses for by_subject, so a student's rank always agrees with the
     * average shown on their own report card. Only subjects with marks
     * recorded count, so a not-yet-graded subject can't drag an otherwise
     * fully-graded student down (or a partially-graded one up).
     */
    public function classRanking(Exam $exam, string $schoolClassId): Collection
    {
        $rows = ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->join('students', 'students.id', '=', 'exam_results.student_id')
            ->where('exam_subjects.exam_id', $exam->id)
            ->where('exam_subjects.school_class_id', $schoolClassId)
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw(
                'exam_results.student_id, students.first_name, students.last_name, students.admission_number,
                avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage,
                sum(exam_results.marks_obtained) as total_obtained,
                sum(exam_subjects.max_marks) as total_max,
                count(*) as subjects_graded'
            )
            ->groupBy('exam_results.student_id', 'students.first_name', 'students.last_name', 'students.admission_number')
            ->orderByDesc('average_percentage')
            ->get()
            ->map(fn ($row) => [
                'student_id' => $row->student_id,
                'name' => "{$row->first_name} {$row->last_name}",
                'admission_number' => $row->admission_number,
                'average_percentage' => round((float) $row->average_percentage, 2),
                'total_obtained' => (float) $row->total_obtained,
                'total_max' => (float) $row->total_max,
                'subjects_graded' => (int) $row->subjects_graded,
                'grade' => $this->gradeBandForPercentage(round((float) $row->average_percentage, 2))?->label,
                'grade_remark' => $this->gradeBandForPercentage(round((float) $row->average_percentage, 2))?->remark,
            ]);

        return $this->assignCompetitionRank($rows, 'average_percentage');
    }

    /**
     * Ranks every graded student within a single exam_subject — the "best
     * in Mathematics" leaderboard, ordered by raw marks since every row
     * shares the same max_marks already.
     */
    public function subjectRanking(ExamSubject $examSubject): Collection
    {
        $rows = ExamResult::query()
            ->join('students', 'students.id', '=', 'exam_results.student_id')
            ->where('exam_results.exam_subject_id', $examSubject->id)
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('exam_results.student_id, students.first_name, students.last_name, students.admission_number, exam_results.marks_obtained')
            ->orderByDesc('exam_results.marks_obtained')
            ->get()
            ->map(fn ($row) => [
                'student_id' => $row->student_id,
                'name' => "{$row->first_name} {$row->last_name}",
                'admission_number' => $row->admission_number,
                'marks_obtained' => (float) $row->marks_obtained,
            ]);

        return $this->assignCompetitionRank($rows, 'marks_obtained');
    }

    /**
     * Standard "competition ranking": tied scores share the same position,
     * and the next distinct score's position skips ahead by the number of
     * students tied ahead of it (1, 2, 2, 4 — not 1, 2, 2, 3).
     */
    protected function assignCompetitionRank(Collection $sortedDescending, string $scoreKey): Collection
    {
        $position = 0;
        $rank = 0;
        $previousScore = null;

        return $sortedDescending->map(function (array $row) use ($scoreKey, &$position, &$rank, &$previousScore) {
            $position++;
            if ($row[$scoreKey] !== $previousScore) {
                $rank = $position;
                $previousScore = $row[$scoreKey];
            }
            $row['position'] = $rank;

            return $row;
        })->values();
    }

    /**
     * A class-wide remark for one exam: overall average, subject-level pass
     * rate, and which subject pulled the class up or down the most — the
     * "how did the class do" summary a class teacher would otherwise have
     * to work out by eye from the ranking table.
     */
    public function classSummary(Exam $exam, string $schoolClassId): array
    {
        $ranking = $this->classRanking($exam, $schoolClassId);

        $passStats = ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->where('exam_subjects.exam_id', $exam->id)
            ->where('exam_subjects.school_class_id', $schoolClassId)
            ->whereNotNull('exam_results.marks_obtained')
            ->whereNotNull('exam_subjects.pass_marks')
            ->selectRaw('count(*) as total, sum(case when exam_results.marks_obtained >= exam_subjects.pass_marks then 1 else 0 end) as passed')
            ->first();

        $bySubject = ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->join('subjects', 'subjects.id', '=', 'exam_subjects.subject_id')
            ->where('exam_subjects.exam_id', $exam->id)
            ->where('exam_subjects.school_class_id', $schoolClassId)
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('subjects.name as subject_name, avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
            ->groupBy('subjects.name')
            ->orderByDesc('average_percentage')
            ->get();

        $strongest = $bySubject->first();
        $weakest = $bySubject->count() > 1 ? $bySubject->last() : null;

        return [
            'class_average' => $ranking->isNotEmpty() ? round((float) $ranking->avg('average_percentage'), 1) : null,
            'pass_rate' => $passStats && $passStats->total > 0 ? round($passStats->passed / $passStats->total * 100, 1) : null,
            'students_graded' => $ranking->count(),
            'strongest_subject' => $strongest
                ? ['name' => $strongest->subject_name, 'average_percentage' => round((float) $strongest->average_percentage, 1)]
                : null,
            'weakest_subject' => $weakest
                ? ['name' => $weakest->subject_name, 'average_percentage' => round((float) $weakest->average_percentage, 1)]
                : null,
        ];
    }

    /**
     * Ranks teachers by their students' average performance in this exam.
     * exam_subjects only records a class+subject combination, not who
     * taught it, so the teacher is inferred from that class+subject's
     * TimetableEntry for the same academic year — the only place that
     * link actually exists. An exam_subject with no matching timetable
     * entry (e.g. a one-off elective) is simply excluded, not attributed
     * to "Unassigned", since that wouldn't be a meaningful ranking entry.
     */
    public function teacherPerformance(Exam $exam): Collection
    {
        $examSubjects = ExamSubject::where('exam_id', $exam->id)->with('subject', 'schoolClass')->get();
        if ($examSubjects->isEmpty()) {
            return collect();
        }

        $teacherByClassSubject = TimetableEntry::query()
            ->where('academic_year_id', $exam->academic_year_id)
            ->whereIn('school_class_id', $examSubjects->pluck('school_class_id')->unique())
            ->whereIn('subject_id', $examSubjects->pluck('subject_id')->unique())
            ->get()
            ->groupBy(fn ($entry) => $entry->school_class_id.'|'.$entry->subject_id)
            ->map(fn ($group) => $group->first()->teacher_id);

        $rows = $examSubjects->map(function (ExamSubject $examSubject) use ($teacherByClassSubject) {
            $teacherId = $teacherByClassSubject->get($examSubject->school_class_id.'|'.$examSubject->subject_id);
            if (! $teacherId) {
                return null;
            }

            $stats = ExamResult::where('exam_subject_id', $examSubject->id)
                ->whereNotNull('marks_obtained')
                ->selectRaw('avg(marks_obtained * 1.0 / ? * 100) as average_percentage, count(*) as graded_count', [(float) $examSubject->max_marks])
                ->first();

            if (! $stats || (int) $stats->graded_count === 0) {
                return null;
            }

            return [
                'teacher_id' => $teacherId,
                'subject_name' => $examSubject->subject->name,
                'class_name' => $examSubject->schoolClass->name,
                'average_percentage' => round((float) $stats->average_percentage, 1),
                'graded_count' => (int) $stats->graded_count,
            ];
        })->filter()->values();

        $teachers = User::whereIn('id', $rows->pluck('teacher_id')->unique())->get()->keyBy('id');

        $aggregated = $rows->groupBy('teacher_id')->map(function (Collection $group, string $teacherId) use ($teachers) {
            $totalGraded = $group->sum('graded_count');
            $weightedAverage = $totalGraded > 0
                ? $group->sum(fn ($r) => $r['average_percentage'] * $r['graded_count']) / $totalGraded
                : 0;

            return [
                'teacher_id' => $teacherId,
                'teacher_name' => $teachers->get($teacherId)?->name ?? 'Unknown',
                'average_percentage' => round($weightedAverage, 1),
                'students_graded' => $totalGraded,
                'subjects' => $group->map(fn ($r) => [
                    'subject_name' => $r['subject_name'],
                    'class_name' => $r['class_name'],
                    'average_percentage' => $r['average_percentage'],
                ])->values(),
            ];
        })->sortByDesc('average_percentage')->values();

        return $this->assignCompetitionRank($aggregated, 'average_percentage');
    }
}
