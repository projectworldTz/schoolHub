<?php

namespace App\Http\Controllers\ParentPortal;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\InvoiceResource;
use App\Http\Resources\School\AttendanceRecordResource;
use App\Http\Resources\School\StudentResource;
use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\ExamResult;
use App\Models\HomeworkSubmission;
use App\Models\Invoice;
use App\Models\Student;
use App\Services\School\ExamService;
use App\Services\School\PerformanceMessageService;
use Illuminate\Http\Request;

/**
 * Every action here is scoped to the current user's OWN linked children —
 * enforced by authorizeChild() on every student-specific route — since a
 * Parent has no `X.manage` permission to fall back on, unlike the
 * school-admin controllers.
 */
class ParentPortalController extends Controller
{
    public function __construct(
        protected ExamService $examService,
        protected PerformanceMessageService $messages,
    ) {}

    protected function guardian(Request $request)
    {
        $guardian = $request->user()->guardianProfile;
        abort_unless($guardian, 403, 'No guardian profile linked to this account.');

        return $guardian;
    }

    protected function authorizeChild(Request $request, Student $student): void
    {
        $isOwnChild = $this->guardian($request)->students()->where('students.id', $student->id)->exists();
        abort_unless($isOwnChild, 403);
    }

    public function children(Request $request)
    {
        $students = $this->guardian($request)->students()
            ->with(['currentEnrollment.academicYear', 'currentEnrollment.schoolClass', 'currentEnrollment.stream'])
            ->get();

        return StudentResource::collection($students);
    }

    public function attendance(Request $request, Student $student)
    {
        $this->authorizeChild($request, $student);

        $records = AttendanceRecord::where('student_id', $student->id)
            ->orderByDesc('date')
            ->limit(60)
            ->get();

        return AttendanceRecordResource::collection($records);
    }

    public function fees(Request $request, Student $student)
    {
        $this->authorizeChild($request, $student);

        $invoices = Invoice::where('student_id', $student->id)
            ->with(['academicYear', 'term', 'items', 'payments'])
            ->orderByDesc('created_at')
            ->get();

        return InvoiceResource::collection($invoices);
    }

    public function homework(Request $request, Student $student)
    {
        $this->authorizeChild($request, $student);

        $submissions = HomeworkSubmission::where('student_id', $student->id)
            ->with('homework.subject')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $submissions->map(fn ($s) => [
                'id' => $s->id,
                'homework_title' => $s->homework->title,
                'subject_name' => $s->homework->subject?->name,
                'due_date' => $s->homework->due_date?->toDateString(),
                'status' => $s->status,
                'grade' => $s->grade,
                'feedback' => $s->feedback,
            ]),
        ]);
    }

    /**
     * Only exams that are 'completed' or 'published' are shown — a parent
     * shouldn't see marks for an exam that's still 'draft'/'scheduled', or
     * mid-grading. 'published' additionally means the school has chosen to
     * put it on the public Notice Board too (see NoticeBoardController);
     * 'completed' is enough on its own for the Parent Portal, which is
     * already an authenticated, ownership-checked channel.
     */
    public function results(Request $request, Student $student)
    {
        $this->authorizeChild($request, $student);

        $results = ExamResult::where('student_id', $student->id)
            ->whereHas('examSubject.exam', fn ($q) => $q->whereIn('status', ['completed', 'published']))
            ->with(['examSubject.exam', 'examSubject.subject'])
            ->get()
            ->groupBy(fn ($r) => $r->examSubject->exam->id)
            ->sortByDesc(fn ($group) => $group->first()->examSubject->exam->start_date);

        return response()->json([
            'data' => $results->map(function ($group) use ($student) {
                $exam = $group->first()->examSubject->exam;
                $schoolClassId = $group->first()->examSubject->school_class_id;
                $classRanking = $this->examService->classRanking($exam, $schoolClassId);
                $classRow = $classRanking->firstWhere('student_id', $student->id);

                return [
                    'exam_id' => $exam->id,
                    'exam_name' => $exam->name,
                    'exam_type' => $exam->exam_type,
                    'subjects' => $group->map(fn ($r) => [
                        'subject_name' => $r->examSubject->subject->name,
                        'marks_obtained' => $r->marks_obtained,
                        'max_marks' => $r->examSubject->max_marks,
                        'grade' => $r->grade,
                    ])->values(),
                    'average_percentage' => $classRow['average_percentage'] ?? null,
                    'overall_grade' => $classRow['grade'] ?? null,
                    'class_position' => $classRow['position'] ?? null,
                    'class_size' => $classRanking->count(),
                    'performance_message' => $this->messages->forStudent(
                        $student->full_name,
                        $classRow['average_percentage'] ?? null,
                        $classRow['grade_remark'] ?? null,
                        $classRow['position'] ?? null,
                        $classRanking->count(),
                    ),
                ];
            })->values(),
        ]);
    }

    public function announcements(Request $request)
    {
        $classIds = $this->guardian($request)->students()
            ->with('currentEnrollment')
            ->get()
            ->pluck('currentEnrollment.school_class_id')
            ->filter()
            ->unique()
            ->values();

        $announcements = Announcement::query()
            ->where(function ($query) use ($classIds) {
                $query->where('audience', 'school')
                    ->orWhere(function ($q) use ($classIds) {
                        $q->where('audience', 'class')->whereIn('school_class_id', $classIds);
                    })
                    ->orWhere(function ($q) {
                        $q->where('audience', 'role')->where('role', 'Parent');
                    });
            })
            ->orderByDesc('published_at')
            ->get();

        return response()->json([
            'data' => $announcements->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'audience' => $a->audience,
                'published_at' => $a->published_at,
            ]),
        ]);
    }
}
