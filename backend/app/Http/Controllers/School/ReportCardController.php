<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubject;
use App\Models\ReportCardRemark;
use App\Models\School;
use App\Models\Student;
use App\Services\School\ExamService;
use App\Services\School\PerformanceMessageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ReportCardController extends Controller
{
    public function __construct(
        protected ExamService $examService,
        protected PerformanceMessageService $messages,
    ) {}

    public function show(Request $request, Student $student)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $exam = Exam::findOrFail($request->query('exam_id'));
        $schoolClassId = $this->classIdFor($student, $exam);
        abort_unless($schoolClassId, 404, 'This student has no exam subjects recorded for this exam.');

        $classRanking = $this->examService->classRanking($exam, $schoolClassId);
        $subjectRankings = $this->subjectRankingsForClass($exam, $schoolClassId);

        return response()->json(['data' => $this->buildReportCard($student, $exam, $classRanking, $subjectRankings)]);
    }

    /**
     * The ranked roster for a class/exam — doubles as the "who do I pick"
     * list for a single-student PDF and the on-screen leaderboard, so the
     * frontend only needs one query to show both.
     */
    public function ranking(Request $request, Exam $exam)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $schoolClassId = $request->query('school_class_id');
        abort_unless($schoolClassId, 422, 'school_class_id is required.');

        $ranking = $this->examService->classRanking($exam, $schoolClassId);

        return response()->json(['data' => $ranking->values()]);
    }

    public function pdf(Request $request, Student $student)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $exam = Exam::findOrFail($request->query('exam_id'));
        $schoolClassId = $this->classIdFor($student, $exam);
        abort_unless($schoolClassId, 404, 'This student has no exam subjects recorded for this exam.');

        $classRanking = $this->examService->classRanking($exam, $schoolClassId);
        $subjectRankings = $this->subjectRankingsForClass($exam, $schoolClassId);
        $reportCard = $this->buildReportCard($student, $exam, $classRanking, $subjectRankings);

        $pdf = Pdf::loadView('documents.report-card', [
            'school' => $this->currentSchool($request),
            'reportCards' => [$reportCard],
        ]);

        return $pdf->download(Str::slug($student->full_name.'-'.$exam->name).'-report-card.pdf');
    }

    /**
     * Only students with at least one graded mark are included — same set
     * classRanking() itself returns — since a student with nothing graded
     * yet has no average/grade/rank to put on a report card. "Generate
     * all" on the frontend maps directly to this endpoint; a single
     * student maps to pdf() above.
     */
    public function bulkPdf(Request $request, Exam $exam)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $schoolClassId = $request->query('school_class_id');
        abort_unless($schoolClassId, 422, 'school_class_id is required.');

        $classRanking = $this->examService->classRanking($exam, $schoolClassId);
        abort_if($classRanking->isEmpty(), 404, 'No graded students found for this class and exam.');

        $subjectRankings = $this->subjectRankingsForClass($exam, $schoolClassId);
        $students = Student::whereIn('id', $classRanking->pluck('student_id'))
            ->with('currentEnrollment.schoolClass')
            ->get()
            ->keyBy('id');

        $reportCards = $classRanking->map(
            fn ($row) => $this->buildReportCard($students[$row['student_id']], $exam, $classRanking, $subjectRankings)
        );

        $pdf = Pdf::loadView('documents.report-card', [
            'school' => $this->currentSchool($request),
            'reportCards' => $reportCards,
        ]);

        $className = $students->first()?->currentEnrollment?->schoolClass?->name ?? 'class';

        return $pdf->download(Str::slug($className.'-'.$exam->name).'-report-cards.pdf');
    }

    /**
     * The class teacher's personal comment for one student's report card —
     * separate from the auto-generated performance_message, which is
     * always computed fresh and can't be edited.
     */
    public function setRemark(Request $request, Exam $exam, Student $student)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $data = $request->validate(['remark' => ['required', 'string', 'max:2000']]);

        $remark = ReportCardRemark::updateOrCreate(
            ['exam_id' => $exam->id, 'student_id' => $student->id],
            ['remark' => $data['remark'], 'entered_by' => $request->user()->id],
        );

        return response()->json(['data' => ['remark' => $remark->remark]]);
    }

    /**
     * How the whole class did on this exam — class average, subject-level
     * pass rate, and the strongest/weakest subject — the summary a class
     * teacher would otherwise have to eyeball from the ranking table.
     */
    public function classSummary(Request $request, Exam $exam)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $schoolClassId = $request->query('school_class_id');
        abort_unless($schoolClassId, 422, 'school_class_id is required.');

        $summary = $this->examService->classSummary($exam, $schoolClassId);
        $band = $summary['class_average'] !== null ? $this->examService->gradeBandForPercentage($summary['class_average']) : null;

        return response()->json([
            'data' => [
                ...$summary,
                'performance_message' => $this->messages->forStudent(
                    'The class',
                    $summary['class_average'],
                    $band?->remark,
                    null,
                    null,
                ),
            ],
        ]);
    }

    /**
     * Teacher leaderboard for this exam — see ExamService::teacherPerformance()
     * for how a teacher is inferred from the timetable.
     */
    public function teacherPerformance(Request $request, Exam $exam)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        return response()->json(['data' => $this->examService->teacherPerformance($exam)]);
    }

    protected function buildReportCard(Student $student, Exam $exam, Collection $classRanking, Collection $subjectRankings): array
    {
        $results = ExamResult::query()
            ->where('student_id', $student->id)
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $exam->id))
            ->with(['examSubject.subject'])
            ->get();

        $classRow = $classRanking->firstWhere('student_id', $student->id);
        $manualRemark = ReportCardRemark::where('exam_id', $exam->id)->where('student_id', $student->id)->first();

        $subjects = $results->map(function ($r) use ($subjectRankings) {
            $ranking = $subjectRankings->get($r->exam_subject_id) ?? collect();
            $subjectRow = $ranking->firstWhere('student_id', $r->student_id);

            return [
                'subject_name' => $r->examSubject->subject->name,
                'marks_obtained' => $r->marks_obtained,
                'max_marks' => $r->examSubject->max_marks,
                'grade' => $r->grade,
                'remarks' => $r->remarks,
                'subject_position' => $subjectRow['position'] ?? null,
                'subject_size' => $ranking->count(),
            ];
        })->values();

        return [
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'admission_number' => $student->admission_number,
            'exam_id' => $exam->id,
            'exam_name' => $exam->name,
            'subjects' => $subjects,
            'summary' => [
                'total_obtained' => $classRow['total_obtained'] ?? 0,
                'total_max' => $classRow['total_max'] ?? 0,
                'average_percentage' => $classRow['average_percentage'] ?? null,
                'overall_grade' => $classRow['grade'] ?? null,
                'class_position' => $classRow['position'] ?? null,
                'class_size' => $classRanking->count(),
                'class_teacher_remark' => $manualRemark?->remark,
                'performance_message' => $this->messages->forStudent(
                    $student->full_name,
                    $classRow['average_percentage'] ?? null,
                    $classRow['grade_remark'] ?? null,
                    $classRow['position'] ?? null,
                    $classRanking->count(),
                ),
            ],
        ];
    }

    protected function subjectRankingsForClass(Exam $exam, string $schoolClassId): Collection
    {
        return ExamSubject::where('exam_id', $exam->id)
            ->where('school_class_id', $schoolClassId)
            ->get()
            ->mapWithKeys(fn (ExamSubject $examSubject) => [$examSubject->id => $this->examService->subjectRanking($examSubject)]);
    }

    protected function classIdFor(Student $student, Exam $exam): ?string
    {
        return ExamResult::query()
            ->where('student_id', $student->id)
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $exam->id))
            ->with('examSubject')
            ->first()
            ?->examSubject
            ?->school_class_id;
    }

    protected function currentSchool(Request $request): School
    {
        abort_unless($request->user()->school_id, 403, 'This account is not attached to a school.');

        return School::findOrFail($request->user()->school_id);
    }
}
