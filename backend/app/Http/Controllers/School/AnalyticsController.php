<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AttendanceRecord;
use App\Models\Branch;
use App\Models\Budget;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Payslip;
use App\Models\SchoolClass;
use App\Models\StaffAttendanceRecord;
use App\Models\StaffProfile;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Read-only aggregate reports over data already built by earlier phases —
 * no new transactional tables, just group-by queries against
 * enrollments/attendance/exam results/finance records. Every query starts
 * from an Eloquent model (not DB::table) so BelongsToSchool's tenant scope
 * still applies; explicit joins only reach reference tables (classes,
 * subjects, categories) for their label, never a second tenant-scoped
 * table's rows. Helper methods that build sparklines/trends accept an
 * already-scoped builder for the same reason — they never construct their
 * own query root.
 *
 * Shaped for a KPI/sparkline/heatmap/funnel/radar-style dashboard rather
 * than a wall of bar charts: each endpoint returns whatever chart types
 * actually fit that data (see AnalyticsPage.tsx), not a uniform shape.
 */
class AnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        [$from, $to] = $this->resolveRange($request);
        $prevSpan = $from->diffInDays($to) ?: 1;
        $prevFrom = (clone $from)->subDays($prevSpan)->subDay();
        $prevTo = (clone $from)->subDay();

        $kpis = [
            $this->kpi(
                'students', 'Active Students', 'number',
                Student::where('status', 'active')->count(),
                $this->cumulativeSpark(Student::where('status', 'active'), 'created_at', $from, $to),
                Student::where('status', 'active')->where('created_at', '<', $prevTo)->count(),
            ),
            $this->kpi(
                'teachers', 'Teachers', 'number',
                User::role(['Teacher', 'Class Teacher'])->count(),
                $this->cumulativeSpark(User::role(['Teacher', 'Class Teacher']), 'created_at', $from, $to),
                User::role(['Teacher', 'Class Teacher'])->where('created_at', '<', $prevTo)->count(),
            ),
            $this->kpi(
                'classes', 'Classes', 'number',
                SchoolClass::count(),
                $this->cumulativeSpark(SchoolClass::query(), 'created_at', $from, $to),
                SchoolClass::where('created_at', '<', $prevTo)->count(),
            ),
            $this->kpi(
                'revenue', 'Revenue Collected', 'currency',
                (float) Payment::whereBetween('paid_at', [$from->toDateString(), $to->toDateString()])->sum('amount'),
                $this->dailySumSpark(Payment::query(), 'paid_at', 'amount', $from, $to),
                (float) Payment::whereBetween('paid_at', [$prevFrom->toDateString(), $prevTo->toDateString()])->sum('amount'),
            ),
            $this->kpi(
                'subjects', 'Subjects', 'number',
                Subject::where('is_active', true)->count(),
                $this->cumulativeSpark(Subject::where('is_active', true), 'created_at', $from, $to),
                Subject::where('is_active', true)->where('created_at', '<', $prevTo)->count(),
            ),
            $this->kpi(
                'exams', 'Exams', 'number',
                Exam::count(),
                $this->cumulativeSpark(Exam::query(), 'created_at', $from, $to),
                Exam::where('created_at', '<', $prevTo)->count(),
            ),
            $this->kpi(
                'attendance_today', 'Attendance Today', 'percent',
                $this->attendanceRateFor(now()->toDateString()),
                $this->attendanceRateSpark($from, $to),
                $this->attendanceRateFor(now()->subDays($prevSpan)->toDateString()),
            ),
            $this->kpi(
                'fee_collection', 'Fee Collection', 'percent',
                $this->collectionRate(),
                $this->collectionRateSpark($from, $to),
                null,
            ),
        ];

        return response()->json(['data' => [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'kpis' => $kpis,
            'admissions_funnel' => $this->admissionsFunnel(),
            'activity' => $this->recentActivity(),
        ]]);
    }

    public function enrollment(Request $request)
    {
        $byClass = StudentEnrollment::query()
            ->where('student_enrollments.status', 'active')
            ->join('school_classes', 'school_classes.id', '=', 'student_enrollments.school_class_id')
            ->selectRaw('school_classes.name as label, count(*) as count')
            ->groupBy('school_classes.name')
            ->orderBy('school_classes.name')
            ->get();

        $byGender = Student::query()
            ->where('status', 'active')
            ->selectRaw("COALESCE(gender, 'unspecified') as label, count(*) as count")
            ->groupBy('gender')
            ->get();

        $byYear = StudentEnrollment::query()
            ->join('academic_years', 'academic_years.id', '=', 'student_enrollments.academic_year_id')
            ->selectRaw('academic_years.name as label, count(*) as count')
            ->groupBy('academic_years.name')
            ->orderBy('academic_years.name')
            ->get();

        return response()->json(['data' => [
            'total_active' => Student::where('status', 'active')->count(),
            'by_class' => $byClass,
            'by_gender' => $byGender,
            'by_year' => $byYear,
            'funnel' => $this->admissionsFunnel(),
        ]]);
    }

    public function attendance(Request $request)
    {
        [$from, $to] = $this->resolveRange($request, 'month');

        $overall = AttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->first();

        $overallRate = $overall && $overall->total > 0 ? round($overall->present / $overall->total * 100, 1) : null;

        $byClass = AttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->join('school_classes', 'school_classes.id', '=', 'attendance_records.school_class_id')
            ->selectRaw("school_classes.name as label, count(*) as total, sum(case when attendance_records.status in ('present','late') then 1 else 0 end) as present")
            ->groupBy('school_classes.name')
            ->orderBy('school_classes.name')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'rate' => $row->total > 0 ? round($row->present / $row->total * 100, 1) : 0,
                'total' => (int) $row->total,
            ]);

        $dailyTrend = AttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("date as day, count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->day,
                'rate' => $row->total > 0 ? round($row->present / $row->total * 100, 1) : 0,
            ]);

        $statusBreakdown = AttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('status as label, count(*) as count')
            ->groupBy('status')
            ->get();

        return response()->json(['data' => [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'overall_rate' => $overallRate,
            'by_class' => $byClass,
            'daily_trend' => $dailyTrend,
            'status_breakdown' => $statusBreakdown,
        ]]);
    }

    public function academics(Request $request)
    {
        // Default to the exam with the most recorded results, not just the
        // most recent by date — an exam that's barely been graded yet is a
        // poor first thing to show on an analytics dashboard.
        $examId = $request->input('exam_id') ?? ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->selectRaw('exam_subjects.exam_id, count(*) as result_count')
            ->groupBy('exam_subjects.exam_id')
            ->orderByDesc('result_count')
            ->value('exam_subjects.exam_id');

        if (! $examId) {
            return response()->json(['data' => [
                'exam_id' => null,
                'by_subject' => [],
                'grade_distribution' => [],
                'pass_rate' => null,
                'radar' => [],
                'exam_trend' => [],
            ]]);
        }

        // '* 1.0' forces float division on every avg(x/y*100) in this method
        // and elsewhere (ExamService's ranking queries do the same) — MySQL's
        // '/' is always true division regardless, but SQLite's isn't when
        // both operands look like integers, which silently truncated every
        // percentage to 0 under the test suite (SQLite in-memory) even
        // though it was correct against the real MySQL database.
        $bySubject = ExamResult::query()
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $examId))
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->join('subjects', 'subjects.id', '=', 'exam_subjects.subject_id')
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('subjects.name as label, avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
            ->groupBy('subjects.name')
            ->orderBy('subjects.name')
            ->get()
            ->map(fn ($row) => ['label' => $row->label, 'average_percentage' => round((float) $row->average_percentage, 1)]);

        $gradeDistribution = ExamResult::query()
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $examId))
            ->whereNotNull('grade')
            ->selectRaw('grade as label, count(*) as count')
            ->groupBy('grade')
            ->orderBy('grade')
            ->get();

        $passFail = ExamResult::query()
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $examId))
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('count(*) as total, sum(case when exam_results.marks_obtained >= exam_subjects.pass_marks then 1 else 0 end) as passed')
            ->first();

        $passRate = $passFail && $passFail->total > 0 ? round($passFail->passed / $passFail->total * 100, 1) : null;

        // Radar: average % per subject, split by class — lets the dashboard
        // compare classes' academic strengths/weaknesses at a glance instead
        // of one more bar chart.
        $radarRows = ExamResult::query()
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $examId))
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->join('subjects', 'subjects.id', '=', 'exam_subjects.subject_id')
            ->join('school_classes', 'school_classes.id', '=', 'exam_subjects.school_class_id')
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('subjects.name as subject_name, school_classes.name as class_name, avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
            ->groupBy('subjects.name', 'school_classes.name')
            ->get();

        $radarSubjects = $radarRows->pluck('subject_name')->unique()->values();
        $radarClasses = $radarRows->pluck('class_name')->unique()->values();
        $radar = $radarSubjects->map(function ($subjectName) use ($radarRows, $radarClasses) {
            $point = ['subject' => $subjectName];
            foreach ($radarClasses as $className) {
                $row = $radarRows->first(fn ($r) => $r->subject_name === $subjectName && $r->class_name === $className);
                $point[$className] = $row ? round((float) $row->average_percentage, 1) : 0;
            }

            return $point;
        })->values();

        // Trend across every exam this year — one line per exam name is
        // overkill; a single average-score-per-exam line answers "are we
        // improving over time" directly.
        $examTrend = ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->join('exams', 'exams.id', '=', 'exam_subjects.exam_id')
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('exams.id as exam_id, exams.name as exam_name, exams.start_date as start_date, avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
            ->groupBy('exams.id', 'exams.name', 'exams.start_date')
            ->orderBy('exams.start_date')
            ->get()
            ->map(fn ($row) => [
                'exam_name' => $row->exam_name,
                'average_percentage' => round((float) $row->average_percentage, 1),
            ]);

        return response()->json(['data' => [
            'exam_id' => $examId,
            'by_subject' => $bySubject,
            'grade_distribution' => $gradeDistribution,
            'pass_rate' => $passRate,
            'radar' => $radar,
            'radar_series' => $radarClasses,
            'exam_trend' => $examTrend,
        ]]);
    }

    public function finance(Request $request)
    {
        $academicYearId = $request->input('academic_year_id');

        $invoices = Invoice::query()->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId));
        $totalBilled = (float) $invoices->clone()->sum('total_amount');
        $totalCollected = (float) $invoices->clone()->sum('amount_paid');

        $expensesByCategory = Expense::query()
            ->join('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->selectRaw('expense_categories.name as label, sum(expenses.amount) as total')
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();

        $revenueTrend = Payment::query()
            ->selectRaw("DATE_FORMAT(paid_at, '%Y-%m') as month, sum(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $expenseTrend = Expense::query()
            ->selectRaw("DATE_FORMAT(expense_date, '%Y-%m') as month, sum(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $payrollCostTrend = Payslip::query()
            ->join('payroll_runs', 'payroll_runs.id', '=', 'payslips.payroll_run_id')
            ->selectRaw("CONCAT(payroll_runs.year, '-', LPAD(payroll_runs.month, 2, '0')) as month, sum(payslips.net_salary) as total")
            ->groupBy('payroll_runs.year', 'payroll_runs.month')
            ->orderBy('payroll_runs.year')
            ->orderBy('payroll_runs.month')
            ->get();

        // Cash flow: collected vs spent (expenses + payroll) per month, for
        // a stacked/area comparison instead of three separate line charts.
        $cashFlow = $this->mergeCashFlow($revenueTrend, $expenseTrend, $payrollCostTrend);

        $paymentStatusBreakdown = Invoice::query()
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->selectRaw('status as label, count(*) as count')
            ->groupBy('status')
            ->get();

        $feeCollectionByClass = Invoice::query()
            ->join('student_enrollments', function ($join) {
                $join->on('student_enrollments.student_id', '=', 'invoices.student_id')
                    ->on('student_enrollments.academic_year_id', '=', 'invoices.academic_year_id');
            })
            ->join('school_classes', 'school_classes.id', '=', 'student_enrollments.school_class_id')
            ->selectRaw('school_classes.name as label, sum(invoices.total_amount) as billed, sum(invoices.amount_paid) as collected')
            ->groupBy('school_classes.name')
            ->orderBy('school_classes.name')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'billed' => (float) $row->billed,
                'collected' => (float) $row->collected,
                'rate' => $row->billed > 0 ? round($row->collected / $row->billed * 100, 1) : 0,
            ]);

        $recentPayments = Payment::query()
            ->with('student')
            ->orderByDesc('paid_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'student_name' => $p->student?->full_name,
                'amount' => (float) $p->amount,
                'method' => $p->method,
                'paid_at' => $p->paid_at?->toDateString(),
            ]);

        return response()->json(['data' => [
            'total_billed' => round($totalBilled, 2),
            'total_collected' => round($totalCollected, 2),
            'total_outstanding' => round($totalBilled - $totalCollected, 2),
            'collection_rate' => $totalBilled > 0 ? round($totalCollected / $totalBilled * 100, 1) : null,
            'expenses_by_category' => $expensesByCategory,
            'revenue_trend' => $revenueTrend,
            'expense_trend' => $expenseTrend,
            'payroll_cost_trend' => $payrollCostTrend,
            'cash_flow' => $cashFlow,
            'payment_status_breakdown' => $paymentStatusBreakdown,
            'fee_collection_by_class' => $feeCollectionByClass,
            'recent_payments' => $recentPayments,
        ]]);
    }

    /**
     * "Actual" is computed on read (sum of expenses in that category dated
     * within the academic year) rather than stored on the budget row —
     * see the Budget migration's note on why.
     */
    public function budget(Request $request)
    {
        $academicYearId = $request->input('academic_year_id')
            ?? Term::where('is_current', true)->value('academic_year_id')
            ?? \App\Models\AcademicYear::orderByDesc('start_date')->value('id');

        if (! $academicYearId) {
            return response()->json(['data' => ['academic_year_id' => null, 'lines' => [], 'total_budgeted' => 0, 'total_actual' => 0]]);
        }

        $budgets = Budget::query()
            ->with('expenseCategory')
            ->where('academic_year_id', $academicYearId)
            ->get();

        // Deliberately all-time actuals, not scoped to the academic year's
        // own date range: expenses aren't required to fall within their
        // school's current academic year window (terms/years are set up
        // independently of when expenses happen to be recorded), so tying
        // "actual" to that window risks a real-looking budget silently
        // showing 0% utilization. Matches how expenses_by_category on the
        // main Finance report is computed (also all-time).
        $actualsByCategory = Expense::query()
            ->join('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->selectRaw('expenses.expense_category_id, sum(expenses.amount) as total')
            ->groupBy('expenses.expense_category_id')
            ->get()
            ->pluck('total', 'expense_category_id');

        $lines = $budgets->map(function (Budget $budget) use ($actualsByCategory) {
            $actual = (float) ($actualsByCategory[$budget->expense_category_id] ?? 0);
            $budgeted = (float) $budget->amount;
            $variance = round($budgeted - $actual, 2);

            return [
                'budget_id' => $budget->id,
                'category' => $budget->expenseCategory->name,
                'budgeted' => $budgeted,
                'actual' => $actual,
                'variance' => $variance,
                'utilization_pct' => $budgeted > 0 ? round($actual / $budgeted * 100, 1) : null,
                'status' => $variance < 0 ? 'over' : ($budgeted > 0 && $actual / $budgeted >= 0.9 ? 'near' : 'under'),
            ];
        })->values();

        return response()->json(['data' => [
            'academic_year_id' => $academicYearId,
            'lines' => $lines,
            'total_budgeted' => round($lines->sum('budgeted'), 2),
            'total_actual' => round($lines->sum('actual'), 2),
        ]]);
    }

    public function staffAttendance(Request $request)
    {
        [$from, $to] = $this->resolveRange($request, 'month');

        $overall = StaffAttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->first();

        $overallRate = $overall && $overall->total > 0 ? round($overall->present / $overall->total * 100, 1) : null;

        $dailyTrend = StaffAttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("date as day, count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->day,
                'rate' => $row->total > 0 ? round($row->present / $row->total * 100, 1) : 0,
            ]);

        $statusBreakdown = StaffAttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('status as label, count(*) as count')
            ->groupBy('status')
            ->get();

        return response()->json(['data' => [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'overall_rate' => $overallRate,
            'daily_trend' => $dailyTrend,
            'status_breakdown' => $statusBreakdown,
        ]]);
    }

    /**
     * Side-by-side comparison across every branch — the actual "multi-branch
     * reporting" deliverable. Only school_classes and staff_profiles carry a
     * branch_id column directly (see the migration that added them);
     * everything here reaches branch transitively through whichever of
     * those two a row is linked to (student_enrollments/attendance_records/
     * exam_subjects -> school_classes.branch_id), the same "derive, don't
     * duplicate" reasoning that keeps a student's own class off the
     * students table. Academic average is deliberately all-time rather than
     * scoped to the current academic year — this school's academic year
     * starts in the future relative to "today" in the seeded demo data,
     * which would zero out every branch's average; same fix already applied
     * to the budget-vs-actual report.
     */
    public function byBranch(Request $request)
    {
        $academicYearId = $request->input('academic_year_id')
            ?? Term::where('is_current', true)->value('academic_year_id')
            ?? \App\Models\AcademicYear::orderByDesc('start_date')->value('id');

        $branches = Branch::orderBy('name')->get(['id', 'name']);
        if ($branches->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $studentCounts = StudentEnrollment::query()
            ->join('school_classes', 'school_classes.id', '=', 'student_enrollments.school_class_id')
            ->where('student_enrollments.status', 'active')
            ->when($academicYearId, fn ($q) => $q->where('student_enrollments.academic_year_id', $academicYearId))
            ->whereNotNull('school_classes.branch_id')
            ->selectRaw('school_classes.branch_id, count(distinct student_enrollments.student_id) as total')
            ->groupBy('school_classes.branch_id')
            ->pluck('total', 'branch_id');

        $staffCounts = StaffProfile::query()
            ->whereNotNull('branch_id')
            ->selectRaw('branch_id, count(*) as total')
            ->groupBy('branch_id')
            ->pluck('total', 'branch_id');

        $attendanceStats = AttendanceRecord::query()
            ->join('school_classes', 'school_classes.id', '=', 'attendance_records.school_class_id')
            ->whereNotNull('school_classes.branch_id')
            ->where('attendance_records.date', '>=', now()->subDays(30)->toDateString())
            ->selectRaw(
                "school_classes.branch_id, count(*) as total,
                sum(case when attendance_records.status = 'present' then 1 else 0 end) as present"
            )
            ->groupBy('school_classes.branch_id')
            ->get()
            ->keyBy('branch_id');

        $academicStats = ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->join('school_classes', 'school_classes.id', '=', 'exam_subjects.school_class_id')
            ->whereNotNull('school_classes.branch_id')
            ->whereNotNull('exam_results.marks_obtained')
            ->selectRaw('school_classes.branch_id, avg(exam_results.marks_obtained * 1.0 / exam_subjects.max_marks * 100) as average_percentage')
            ->groupBy('school_classes.branch_id')
            ->pluck('average_percentage', 'branch_id');

        $data = $branches->map(function (Branch $branch) use ($studentCounts, $staffCounts, $attendanceStats, $academicStats) {
            $attendance = $attendanceStats->get($branch->id);

            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'student_count' => (int) ($studentCounts[$branch->id] ?? 0),
                'staff_count' => (int) ($staffCounts[$branch->id] ?? 0),
                'attendance_rate' => $attendance && $attendance->total > 0
                    ? round($attendance->present / $attendance->total * 100, 1)
                    : null,
                'academic_average' => isset($academicStats[$branch->id])
                    ? round((float) $academicStats[$branch->id], 1)
                    : null,
            ];
        });

        return response()->json(['data' => $data->values()]);
    }

    // ---- shared helpers -------------------------------------------------

    /**
     * @return array{0: CarbonInterface, 1: CarbonInterface}
     */
    protected function resolveRange(Request $request, string $default = 'month'): array
    {
        $range = $request->input('range', $default);
        $now = now();

        return match ($range) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'term' => $this->currentTermRange($now),
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom' => [
                $request->filled('from') ? Carbon::parse($request->input('from')) : $now->copy()->subDays(30),
                $request->filled('to') ? Carbon::parse($request->input('to')) : $now->copy(),
            ],
            default => [$now->copy()->subDays(30), $now->copy()],
        };
    }

    protected function currentTermRange(Carbon $now): array
    {
        $term = Term::where('is_current', true)->first() ?? Term::orderByDesc('start_date')->first();

        if (! $term) {
            return [$now->copy()->subDays(90), $now->copy()];
        }

        return [Carbon::parse($term->start_date), Carbon::parse($term->end_date ?? $now)];
    }

    protected function kpi(string $key, string $label, string $format, float $value, array $sparkline, ?float $previousValue = null): array
    {
        $delta = $previousValue !== null ? $this->pctDelta($value, $previousValue) : null;

        return [
            'key' => $key,
            'label' => $label,
            'format' => $format,
            'value' => $value,
            'delta_pct' => $delta,
            'trend' => $this->trendFor($delta),
            'sparkline' => $sparkline,
        ];
    }

    protected function pctDelta(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            return $current > 0 ? 100.0 : null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    protected function trendFor(?float $delta): string
    {
        if ($delta === null || abs($delta) < 0.5) {
            return 'flat';
        }

        return $delta > 0 ? 'up' : 'down';
    }

    /**
     * Every day in [from, to] gets a point — running count of rows whose
     * $dateColumn is on or before that day. Used for KPIs that are more
     * "how has this grown" than "what happened each day" (headcounts).
     */
    protected function cumulativeSpark(Builder $builder, string $dateColumn, CarbonInterface $from, CarbonInterface $to): array
    {
        $before = (clone $builder)->whereDate($dateColumn, '<', $from->toDateString())->count();

        // whereDate (not whereBetween with raw date strings) — $dateColumn
        // may be a full datetime (created_at), and BETWEEN against a
        // date-only upper bound implicitly means midnight, silently
        // excluding every same-day row created after 00:00:00.
        $daily = (clone $builder)
            ->whereDate($dateColumn, '>=', $from->toDateString())
            ->whereDate($dateColumn, '<=', $to->toDateString())
            ->selectRaw("DATE($dateColumn) as day, count(*) as c")
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => (string) $row->day);

        $points = [];
        $running = $before;
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $day = $cursor->toDateString();
            $running += (int) ($daily[$day]->c ?? 0);
            $points[] = ['date' => $day, 'value' => $running];
            $cursor->addDay();
        }

        return $points;
    }

    /**
     * One point per day with the sum of $valueColumn that day (0 for days
     * with no rows) — for genuinely time-series KPIs (revenue).
     */
    protected function dailySumSpark(Builder $builder, string $dateColumn, string $valueColumn, CarbonInterface $from, CarbonInterface $to): array
    {
        $daily = (clone $builder)
            ->whereDate($dateColumn, '>=', $from->toDateString())
            ->whereDate($dateColumn, '<=', $to->toDateString())
            ->selectRaw("DATE($dateColumn) as day, sum($valueColumn) as total")
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => (string) $row->day);

        $points = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $day = $cursor->toDateString();
            $points[] = ['date' => $day, 'value' => (float) ($daily[$day]->total ?? 0)];
            $cursor->addDay();
        }

        return $points;
    }

    protected function attendanceRateFor(string $date): float
    {
        $row = AttendanceRecord::where('date', $date)
            ->selectRaw("count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->first();

        return $row && $row->total > 0 ? round($row->present / $row->total * 100, 1) : 0.0;
    }

    protected function attendanceRateSpark(CarbonInterface $from, CarbonInterface $to): array
    {
        $daily = AttendanceRecord::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("date as day, count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => (string) $row->day);

        $points = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $day = $cursor->toDateString();
            $row = $daily[$day] ?? null;
            $points[] = ['date' => $day, 'value' => $row && $row->total > 0 ? round($row->present / $row->total * 100, 1) : 0];
            $cursor->addDay();
        }

        return $points;
    }

    protected function collectionRate(): float
    {
        $billed = (float) Invoice::sum('total_amount');
        $collected = (float) Invoice::sum('amount_paid');

        return $billed > 0 ? round($collected / $billed * 100, 1) : 0.0;
    }

    protected function collectionRateSpark(CarbonInterface $from, CarbonInterface $to): array
    {
        // Cumulative collected / cumulative billed as of each day — a
        // running "how are we tracking against total fees" line rather
        // than a duplicate of the revenue KPI's daily-amount sparkline.
        $billedBefore = (float) Invoice::whereDate('created_at', '<', $from->toDateString())->sum('total_amount');
        $paymentsBefore = (float) Payment::whereDate('paid_at', '<', $from->toDateString())->sum('amount');

        $dailyBilled = Invoice::query()
            ->whereDate('created_at', '>=', $from->toDateString())
            ->whereDate('created_at', '<=', $to->toDateString())
            ->selectRaw('DATE(created_at) as day, sum(total_amount) as total')
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => (string) $row->day);

        $dailyPaid = Payment::query()
            ->whereBetween('paid_at', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('paid_at as day, sum(amount) as total')
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => (string) $row->day);

        $points = [];
        $runningBilled = $billedBefore;
        $runningPaid = $paymentsBefore;
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $day = $cursor->toDateString();
            $runningBilled += (float) ($dailyBilled[$day]->total ?? 0);
            $runningPaid += (float) ($dailyPaid[$day]->total ?? 0);
            $points[] = ['date' => $day, 'value' => $runningBilled > 0 ? round($runningPaid / $runningBilled * 100, 1) : 0];
            $cursor->addDay();
        }

        return $points;
    }

    /**
     * Applications don't record a linear pipeline history, only a current
     * status — this approximates a funnel by treating each status as
     * "reached at least this stage", which is monotonically non-increasing
     * by construction (exactly what a funnel needs).
     */
    protected function admissionsFunnel(): array
    {
        $total = AdmissionApplication::count();
        $reviewed = AdmissionApplication::whereIn('status', ['under_review', 'accepted', 'rejected', 'enrolled'])->count();
        $accepted = AdmissionApplication::whereIn('status', ['accepted', 'enrolled'])->count();
        $enrolled = AdmissionApplication::where('status', 'enrolled')->count();

        return [
            ['stage' => 'Applied', 'count' => $total],
            ['stage' => 'Under Review', 'count' => $reviewed],
            ['stage' => 'Accepted', 'count' => $accepted],
            ['stage' => 'Enrolled', 'count' => $enrolled],
        ];
    }

    protected function recentActivity(): array
    {
        $admissions = AdmissionApplication::query()
            ->orderByDesc('created_at')
            ->limit(4)
            ->get()
            ->map(fn ($a) => [
                'type' => 'admission',
                'text' => "{$a->applicant_first_name} {$a->applicant_last_name} applied — {$a->status}",
                'at' => $a->created_at,
            ]);

        $payments = Payment::query()
            ->with('student')
            ->orderByDesc('created_at')
            ->limit(4)
            ->get()
            ->map(fn ($p) => [
                'type' => 'payment',
                'text' => ($p->student?->full_name ?? 'A student').' paid '.number_format((float) $p->amount),
                'at' => $p->created_at,
            ]);

        $exams = Exam::query()
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(fn ($e) => [
                'type' => 'exam',
                'text' => "Exam scheduled: {$e->name}",
                'at' => $e->created_at,
            ]);

        return $admissions->concat($payments)->concat($exams)
            ->sortByDesc('at')
            ->take(8)
            ->values()
            ->map(fn ($row) => [...$row, 'at' => $row['at']?->toIso8601String()])
            ->all();
    }

    protected function mergeCashFlow($revenueTrend, $expenseTrend, $payrollCostTrend): array
    {
        $months = collect([$revenueTrend, $expenseTrend, $payrollCostTrend])
            ->flatMap(fn ($series) => $series->pluck('month'))
            ->unique()
            ->sort()
            ->values();

        $revenueByMonth = $revenueTrend->pluck('total', 'month');
        $expenseByMonth = $expenseTrend->pluck('total', 'month');
        $payrollByMonth = $payrollCostTrend->pluck('total', 'month');

        return $months->map(fn ($month) => [
            'month' => $month,
            'in' => (float) ($revenueByMonth[$month] ?? 0),
            'out' => round((float) ($expenseByMonth[$month] ?? 0) + (float) ($payrollByMonth[$month] ?? 0), 2),
        ])->values()->all();
    }
}
