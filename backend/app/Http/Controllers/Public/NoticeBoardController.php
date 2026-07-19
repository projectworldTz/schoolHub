<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSubject;
use App\Models\School;
use App\Services\School\ExamService;
use App\Support\Tenancy\Tenant;

/**
 * The digital equivalent of a school pinning the exam results sheet to a
 * physical notice board — no login required, matching how this already
 * works on paper: once a school marks an exam 'published' (see
 * ExamController::updateStatus), anyone who knows the school and can pick
 * the class off a list can see that class's full ranked result sheet,
 * same as walking up to the board. A draft/scheduled/completed-but-not-
 * published exam is never reachable here, regardless of how much has been
 * graded — publishing is a deliberate, separate step from grading.
 *
 * Every method resolves the school by slug and manually sets the tenant
 * context — deliberately NOT via Eloquent route-model-binding for
 * {exam}/{schoolClass}, since binding happens before this controller runs;
 * with no tenant set yet, BelongsToSchool's "no tenant = nothing visible"
 * default would make that lookup 404 every time before the school is even
 * resolved. {exam} and {schoolClass} are plain route params, looked up
 * manually inside each method after resolveTenant() has run.
 */
class NoticeBoardController extends Controller
{
    public function __construct(protected ExamService $examService) {}

    public function exams(string $slug)
    {
        $this->resolveTenant($slug);

        $exams = Exam::query()
            ->where('status', 'published')
            ->with('academicYear')
            ->orderByDesc('start_date')
            ->get();

        return response()->json([
            'data' => $exams->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'name' => $exam->name,
                'exam_type' => $exam->exam_type,
                'academic_year_name' => $exam->academicYear?->name,
            ]),
        ]);
    }

    public function classes(string $slug, string $examId)
    {
        $this->resolveTenant($slug);
        $exam = $this->publishedExamOrFail($examId);

        $classes = ExamSubject::where('exam_id', $exam->id)
            ->with('schoolClass')
            ->get()
            ->pluck('schoolClass')
            ->filter()
            ->unique('id')
            ->values();

        return response()->json([
            'data' => $classes->map(fn ($schoolClass) => ['id' => $schoolClass->id, 'name' => $schoolClass->name]),
        ]);
    }

    public function ranking(string $slug, string $examId, string $schoolClassId)
    {
        $this->resolveTenant($slug);
        $exam = $this->publishedExamOrFail($examId);

        $examSubject = ExamSubject::where('exam_id', $exam->id)
            ->where('school_class_id', $schoolClassId)
            ->with('schoolClass')
            ->first();
        abort_unless($examSubject, 404);

        $ranking = $this->examService->classRanking($exam, $schoolClassId);

        return response()->json([
            'data' => [
                'exam_name' => $exam->name,
                'class_name' => $examSubject->schoolClass->name,
                'ranking' => $ranking->map(fn ($row) => [
                    'position' => $row['position'],
                    'name' => $row['name'],
                    'admission_number' => $row['admission_number'],
                    'average_percentage' => $row['average_percentage'],
                    'grade' => $row['grade'],
                ]),
            ],
        ]);
    }

    protected function publishedExamOrFail(string $examId): Exam
    {
        $exam = Exam::find($examId);
        abort_unless($exam && $exam->status === 'published', 404);

        return $exam;
    }

    protected function resolveTenant(string $slug): School
    {
        $school = Tenant::runAsPlatform(
            fn () => School::where('slug', $slug)->where('status', 'approved')->firstOrFail()
        );

        Tenant::set($school->id);

        return $school;
    }
}
