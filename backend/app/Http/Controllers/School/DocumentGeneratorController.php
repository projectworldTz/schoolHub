<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\GradingSystem;
use App\Models\School;
use App\Models\StaffContract;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Renders existing domain data (student records, exam results, staff
 * contracts) as downloadable PDFs. Each method reuses the permission that
 * already gates the underlying data (students.manage / exams.manage /
 * staff.manage) rather than a new 'documents.generate' permission — a
 * generated document is just another view of data that permission already
 * controls, the same reasoning ReportCardController applies.
 */
class DocumentGeneratorController extends Controller
{
    public function studentCertificate(Request $request, Student $student)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        $type = $request->query('type', 'enrollment') === 'completion' ? 'completion' : 'enrollment';
        $student->load(['currentEnrollment.schoolClass', 'currentEnrollment.academicYear']);

        $pdf = Pdf::loadView('documents.certificate', [
            'school' => $this->currentSchool($request),
            'student' => $student,
            'certificateTitle' => $type === 'completion' ? 'Certificate of Completion' : 'Certificate of Enrollment',
            'className' => $student->currentEnrollment?->schoolClass?->name,
            'academicYearName' => $student->currentEnrollment?->academicYear?->name,
        ]);

        return $pdf->download(Str::slug($student->full_name).'-certificate.pdf');
    }

    public function studentTranscript(Request $request, Student $student)
    {
        abort_unless($request->user()->can('exams.manage'), 403);

        $gradingSystem = GradingSystem::where('is_default', true)->first();

        $exams = Exam::query()
            ->whereHas('examSubjects.results', fn ($q) => $q->where('student_id', $student->id))
            ->with([
                'academicYear',
                'term',
                'examSubjects' => fn ($q) => $q
                    ->whereHas('results', fn ($r) => $r->where('student_id', $student->id))
                    ->with(['subject', 'results' => fn ($r) => $r->where('student_id', $student->id)]),
            ])
            ->orderBy('start_date')
            ->get()
            ->map(function (Exam $exam) use ($gradingSystem) {
                $totalObtained = 0;
                $totalMax = 0;

                $subjects = $exam->examSubjects->map(function ($examSubject) use (&$totalObtained, &$totalMax) {
                    $result = $examSubject->results->first();

                    if ($result?->marks_obtained !== null) {
                        $totalObtained += (float) $result->marks_obtained;
                        $totalMax += (float) $examSubject->max_marks;
                    }

                    return [
                        'subject_name' => $examSubject->subject->name,
                        'marks_obtained' => $result?->marks_obtained,
                        'max_marks' => $examSubject->max_marks,
                        'grade' => $result?->grade,
                    ];
                });

                $averagePercentage = $totalMax > 0 ? round($totalObtained / $totalMax * 100, 2) : null;
                $overallGrade = null;

                if ($averagePercentage !== null && $gradingSystem) {
                    $overallGrade = $gradingSystem->gradeBands()
                        ->where('min_score', '<=', $averagePercentage)
                        ->where('max_score', '>=', $averagePercentage)
                        ->first()?->label;
                }

                return [
                    'exam_name' => $exam->name,
                    'academic_year_name' => $exam->academicYear->name,
                    'term_name' => $exam->term?->name,
                    'subjects' => $subjects,
                    'average_percentage' => $averagePercentage,
                    'overall_grade' => $overallGrade,
                ];
            });

        $pdf = Pdf::loadView('documents.transcript', [
            'school' => $this->currentSchool($request),
            'student' => $student,
            'exams' => $exams,
        ]);

        return $pdf->download(Str::slug($student->full_name).'-transcript.pdf');
    }

    public function staffContract(Request $request, StaffContract $contract)
    {
        abort_unless($request->user()->can('staff.manage'), 403);

        $contract->load(['user.staffProfile']);

        $pdf = Pdf::loadView('documents.contract', [
            'school' => $this->currentSchool($request),
            'contract' => $contract,
            'jobTitle' => $contract->user->staffProfile?->job_title,
        ]);

        return $pdf->download(Str::slug($contract->user->name).'-contract.pdf');
    }

    protected function currentSchool(Request $request): School
    {
        abort_unless($request->user()->school_id, 403, 'This account is not attached to a school.');

        return School::findOrFail($request->user()->school_id);
    }
}
