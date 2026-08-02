<?php

namespace App\Services\AI\Tools;

use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;
use App\Services\School\ExamService;

/**
 * "Summarise Form Four examination performance." Wraps
 * ExamService::classSummary() directly rather than recalculating averages
 * — that's the same method the report-card/analytics screens use, so the
 * AI's numbers can never drift from what the rest of the app shows.
 */
class ExamPerformanceSummaryTool
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function name(): string
    {
        return 'exams.performance_summary';
    }

    public function authorize(User $user): bool|string
    {
        if (! $this->authorization->canUseExamPerformanceTool($user)) {
            return 'You do not have permission to view examination performance.';
        }

        return true;
    }

    /** @param  array<string, mixed>  $params */
    public function run(User $user, array $params, ExamService $examService): array
    {
        $classQuery = SchoolClass::query();
        if (filled($params['class_name'] ?? null)) {
            $classQuery->where('name', 'like', $params['class_name']);
        }

        if (! $this->authorization->canViewSchoolWideExamPerformance($user)) {
            $classIds = $user->assignedClassIds();
            if ($classIds->isEmpty()) {
                return ['error' => 'This user has no assigned classes.'];
            }
            $classQuery->whereIn('id', $classIds);
        }

        $schoolClasses = $classQuery->get();

        if ($schoolClasses->isEmpty()) {
            return ['error' => filled($params['class_name'] ?? null)
                ? "No accessible class named \"{$params['class_name']}\" was found."
                : 'No accessible classes were found.'];
        }

        if ($schoolClasses->count() > 1) {
            return [
                'note' => 'Multiple classes are accessible and none was specified — ask which one.',
                'available_classes' => $schoolClasses->pluck('name')->values()->all(),
            ];
        }

        $schoolClass = $schoolClasses->first();

        $examQuery = Exam::whereIn('status', ['completed', 'published'])
            ->orderByDesc('end_date');
        if (filled($params['exam_name'] ?? null)) {
            $examQuery->where('name', 'like', $params['exam_name']);
        }
        $exams = $examQuery->get();

        if ($exams->isEmpty()) {
            return ['error' => 'No completed examinations were found.', 'class_name' => $schoolClass->name];
        }

        if ($exams->count() > 1 && blank($params['exam_name'] ?? null)) {
            return [
                'note' => 'Multiple examinations are available and none was specified — ask which one.',
                'class_name' => $schoolClass->name,
                'available_exams' => $exams->pluck('name')->values()->all(),
            ];
        }

        $exam = $exams->first();
        $summary = $examService->classSummary($exam, $schoolClass->id);

        return [
            'exam_name' => $exam->name,
            'class_name' => $schoolClass->name,
            ...$summary,
        ];
    }
}
