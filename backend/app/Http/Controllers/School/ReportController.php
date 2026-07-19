<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AttendanceRecord;
use App\Models\BookLoan;
use App\Models\ClinicVisit;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Expense;
use App\Models\GradingSystem;
use App\Models\HostelRoom;
use App\Models\Invoice;
use App\Models\InventoryItem;
use App\Models\Payslip;
use App\Models\StaffAttendanceRecord;
use App\Models\StaffProfile;
use App\Models\Student;
use App\Models\TransportRoute;
use Illuminate\Http\Request;

/**
 * A catalog of pre-built tabular reports, one controller action per report,
 * behind a single uniform {columns, rows} contract so the frontend needs
 * exactly one table-rendering component (with CSV export) for all of them
 * — see ReportLibraryPage.tsx. Deliberately not a literal "100+ reports":
 * see ROADMAP.md for why a curated catalog across every module beats an
 * arbitrary count.
 */
class ReportController extends Controller
{
    /**
     * @var array<string, array{title: string, description: string, category: string, permission: string}>
     */
    protected const CATALOG = [
        'students' => ['title' => 'Student directory', 'description' => 'Every active student with class and guardian contact.', 'category' => 'Academic', 'permission' => 'students.manage'],
        'staff' => ['title' => 'Staff directory', 'description' => 'Every active staff member with role and department.', 'category' => 'HR', 'permission' => 'staff.manage'],
        'admissions' => ['title' => 'Admissions pipeline', 'description' => 'Every application and its current status.', 'category' => 'Academic', 'permission' => 'admissions.manage'],
        'attendance-summary' => ['title' => 'Student attendance summary', 'description' => 'Attendance rate per student over the last 30 days.', 'category' => 'Attendance', 'permission' => 'attendance.manage'],
        'staff-attendance-summary' => ['title' => 'Staff attendance summary', 'description' => 'Attendance rate per staff member over the last 30 days.', 'category' => 'Attendance', 'permission' => 'staff.manage'],
        'exam-results' => ['title' => 'Exam results', 'description' => 'Average score and grade per student for the most recent exam.', 'category' => 'Academic', 'permission' => 'exams.manage'],
        'fee-collection' => ['title' => 'Fee collection', 'description' => 'Billed, collected, and outstanding balance per student.', 'category' => 'Finance', 'permission' => 'finance.manage'],
        'expenses' => ['title' => 'Expense ledger', 'description' => 'Every recorded expense with category and who logged it.', 'category' => 'Finance', 'permission' => 'expenses.manage'],
        'payroll' => ['title' => 'Payroll — latest run', 'description' => 'Payslips from the most recently processed payroll run.', 'category' => 'Finance', 'permission' => 'payroll.manage'],
        'library-loans' => ['title' => 'Library loans', 'description' => 'Every book loan, borrowed and returned dates.', 'category' => 'Facilities', 'permission' => 'library.manage'],
        'inventory-stock' => ['title' => 'Inventory stock levels', 'description' => 'Current quantity vs. reorder level per item.', 'category' => 'Facilities', 'permission' => 'inventory.manage'],
        'hostel-occupancy' => ['title' => 'Hostel occupancy', 'description' => 'Occupied vs. capacity per room.', 'category' => 'Facilities', 'permission' => 'hostel.manage'],
        'transport-roster' => ['title' => 'Transport roster', 'description' => 'Assigned students vs. capacity per route.', 'category' => 'Facilities', 'permission' => 'transport.manage'],
        'clinic-visits' => ['title' => 'Clinic visit log', 'description' => 'Every recorded clinic visit with diagnosis and treatment.', 'category' => 'Facilities', 'permission' => 'clinic.manage'],
    ];

    public function catalog()
    {
        $rows = collect(self::CATALOG)->map(fn ($meta, $key) => ['key' => $key, ...$meta])->values();

        return response()->json(['data' => $rows]);
    }

    public function show(Request $request, string $key)
    {
        $meta = self::CATALOG[$key] ?? null;
        abort_if($meta === null, 404, 'Unknown report.');
        abort_unless($request->user()->can($meta['permission']), 403);

        $result = match ($key) {
            'students' => $this->studentsReport(),
            'staff' => $this->staffReport(),
            'admissions' => $this->admissionsReport(),
            'attendance-summary' => $this->attendanceSummaryReport(),
            'staff-attendance-summary' => $this->staffAttendanceSummaryReport(),
            'exam-results' => $this->examResultsReport(),
            'fee-collection' => $this->feeCollectionReport(),
            'expenses' => $this->expensesReport(),
            'payroll' => $this->payrollReport(),
            'library-loans' => $this->libraryLoansReport(),
            'inventory-stock' => $this->inventoryStockReport(),
            'hostel-occupancy' => $this->hostelOccupancyReport(),
            'transport-roster' => $this->transportRosterReport(),
            'clinic-visits' => $this->clinicVisitsReport(),
        };

        return response()->json(['data' => [
            'key' => $key,
            'title' => $meta['title'],
            ...$result,
        ]]);
    }

    protected function studentsReport(): array
    {
        $rows = Student::query()
            ->where('status', 'active')
            ->with(['currentEnrollment.schoolClass'])
            ->orderBy('last_name')
            ->get()
            ->map(fn (Student $s) => [
                'admission_number' => $s->admission_number,
                'full_name' => $s->full_name,
                'class' => $s->currentEnrollment?->schoolClass?->name ?? '—',
                'gender' => $s->gender ?? '—',
                'status' => $s->status,
                'emergency_contact' => $s->emergency_contact_phone ?? '—',
            ]);

        return [
            'columns' => [
                ['key' => 'admission_number', 'label' => 'Admission #'],
                ['key' => 'full_name', 'label' => 'Name'],
                ['key' => 'class', 'label' => 'Class'],
                ['key' => 'gender', 'label' => 'Gender'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'emergency_contact', 'label' => 'Emergency contact'],
            ],
            'rows' => $rows,
        ];
    }

    protected function staffReport(): array
    {
        $rows = StaffProfile::query()
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->with(['user', 'department'])
            ->get()
            ->sortBy(fn ($s) => $s->user->name)
            ->values()
            ->map(fn (StaffProfile $s) => [
                'staff_number' => $s->staff_number,
                'name' => $s->user->name,
                'job_title' => $s->job_title ?? '—',
                'department' => $s->department?->name ?? '—',
                'employment_type' => str_replace('_', ' ', $s->employment_type ?? '—'),
                'hire_date' => $s->hire_date?->toDateString() ?? '—',
            ]);

        return [
            'columns' => [
                ['key' => 'staff_number', 'label' => 'Staff #'],
                ['key' => 'name', 'label' => 'Name'],
                ['key' => 'job_title', 'label' => 'Job title'],
                ['key' => 'department', 'label' => 'Department'],
                ['key' => 'employment_type', 'label' => 'Employment type'],
                ['key' => 'hire_date', 'label' => 'Hire date'],
            ],
            'rows' => $rows,
        ];
    }

    protected function admissionsReport(): array
    {
        $rows = AdmissionApplication::query()
            ->with('applyingForClass')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (AdmissionApplication $a) => [
                'applicant' => "{$a->applicant_first_name} {$a->applicant_last_name}",
                'applying_for' => $a->applyingForClass?->name ?? '—',
                'status' => $a->status,
                'guardian' => $a->guardian_name ?? '—',
                'date' => $a->created_at?->toDateString(),
            ]);

        return [
            'columns' => [
                ['key' => 'applicant', 'label' => 'Applicant'],
                ['key' => 'applying_for', 'label' => 'Applying for'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'guardian', 'label' => 'Guardian'],
                ['key' => 'date', 'label' => 'Applied on'],
            ],
            'rows' => $rows,
        ];
    }

    protected function attendanceSummaryReport(): array
    {
        $since = now()->subDays(30)->toDateString();

        $rows = AttendanceRecord::query()
            ->join('students', 'students.id', '=', 'attendance_records.student_id')
            ->join('school_classes', 'school_classes.id', '=', 'attendance_records.school_class_id')
            ->where('attendance_records.date', '>=', $since)
            ->selectRaw("students.id, CONCAT(students.first_name, ' ', students.last_name) as full_name, school_classes.name as class_name, count(*) as total, sum(case when attendance_records.status in ('present','late') then 1 else 0 end) as present")
            ->groupBy('students.id', 'full_name', 'class_name')
            ->orderBy('class_name')
            ->orderBy('full_name')
            ->get()
            ->map(fn ($row) => [
                'full_name' => $row->full_name,
                'class' => $row->class_name,
                'days_marked' => (int) $row->total,
                'rate' => $row->total > 0 ? round($row->present / $row->total * 100, 1).'%' : '—',
            ]);

        return [
            'columns' => [
                ['key' => 'full_name', 'label' => 'Student'],
                ['key' => 'class', 'label' => 'Class'],
                ['key' => 'days_marked', 'label' => 'Days marked'],
                ['key' => 'rate', 'label' => 'Attendance rate (30d)'],
            ],
            'rows' => $rows,
        ];
    }

    protected function staffAttendanceSummaryReport(): array
    {
        $since = now()->subDays(30)->toDateString();

        $rows = StaffAttendanceRecord::query()
            ->join('users', 'users.id', '=', 'staff_attendance_records.user_id')
            ->where('staff_attendance_records.date', '>=', $since)
            ->selectRaw('users.id, users.name, count(*) as total, sum(case when staff_attendance_records.status in (\'present\',\'late\') then 1 else 0 end) as present')
            ->groupBy('users.id', 'users.name')
            ->orderBy('users.name')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'days_marked' => (int) $row->total,
                'rate' => $row->total > 0 ? round($row->present / $row->total * 100, 1).'%' : '—',
            ]);

        return [
            'columns' => [
                ['key' => 'name', 'label' => 'Staff member'],
                ['key' => 'days_marked', 'label' => 'Days marked'],
                ['key' => 'rate', 'label' => 'Attendance rate (30d)'],
            ],
            'rows' => $rows,
        ];
    }

    protected function examResultsReport(): array
    {
        // Richest exam (most recorded results), not just the most recent by
        // date — an exam that's barely been graded is a poor report to show
        // by default. Same reasoning as AnalyticsController::academics().
        $examId = ExamResult::query()
            ->join('exam_subjects', 'exam_subjects.id', '=', 'exam_results.exam_subject_id')
            ->selectRaw('exam_subjects.exam_id, count(*) as result_count')
            ->groupBy('exam_subjects.exam_id')
            ->orderByDesc('result_count')
            ->value('exam_subjects.exam_id');

        if (! $examId) {
            return ['columns' => [], 'rows' => []];
        }

        $exam = Exam::find($examId);
        $gradingSystem = GradingSystem::where('is_default', true)->first();

        $rows = ExamResult::query()
            ->whereHas('examSubject', fn ($q) => $q->where('exam_id', $examId))
            ->with(['student', 'examSubject'])
            ->whereNotNull('marks_obtained')
            ->get()
            ->groupBy('student_id')
            ->map(function ($results) use ($gradingSystem) {
                $totalObtained = $results->sum(fn ($r) => (float) $r->marks_obtained);
                $totalMax = $results->sum(fn ($r) => (float) $r->examSubject->max_marks);
                $average = $totalMax > 0 ? round($totalObtained / $totalMax * 100, 1) : 0;
                $grade = $gradingSystem?->gradeBands()
                    ->where('min_score', '<=', $average)
                    ->where('max_score', '>=', $average)
                    ->first()?->label;

                return [
                    'full_name' => $results->first()->student->full_name,
                    'subjects_taken' => $results->count(),
                    'average_percentage' => $average.'%',
                    'grade' => $grade ?? '—',
                ];
            })
            ->sortByDesc('average_percentage')
            ->values();

        return [
            'columns' => [
                ['key' => 'full_name', 'label' => 'Student'],
                ['key' => 'subjects_taken', 'label' => 'Subjects taken'],
                ['key' => 'average_percentage', 'label' => 'Average %'],
                ['key' => 'grade', 'label' => 'Grade'],
            ],
            'rows' => $rows,
            'context' => $exam?->name,
        ];
    }

    protected function feeCollectionReport(): array
    {
        $rows = Invoice::query()
            ->with(['student'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Invoice $i) => [
                'full_name' => $i->student?->full_name ?? '—',
                'invoice_number' => $i->invoice_number,
                'billed' => number_format((float) $i->total_amount),
                'collected' => number_format((float) $i->amount_paid),
                'balance' => number_format((float) $i->balance),
                'status' => $i->status,
            ]);

        return [
            'columns' => [
                ['key' => 'full_name', 'label' => 'Student'],
                ['key' => 'invoice_number', 'label' => 'Invoice #'],
                ['key' => 'billed', 'label' => 'Billed'],
                ['key' => 'collected', 'label' => 'Collected'],
                ['key' => 'balance', 'label' => 'Balance'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    protected function expensesReport(): array
    {
        $rows = Expense::query()
            ->with(['category', 'recordedBy'])
            ->orderByDesc('expense_date')
            ->get()
            ->map(fn (Expense $e) => [
                'expense_date' => $e->expense_date?->toDateString(),
                'category' => $e->category?->name ?? '—',
                'amount' => number_format((float) $e->amount),
                'description' => $e->description ?? '—',
                'recorded_by' => $e->recordedBy?->name ?? '—',
            ]);

        return [
            'columns' => [
                ['key' => 'expense_date', 'label' => 'Date'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'amount', 'label' => 'Amount'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'recorded_by', 'label' => 'Recorded by'],
            ],
            'rows' => $rows,
        ];
    }

    protected function payrollReport(): array
    {
        // Richest run (most payslips), not just the most recent by
        // year/month — a run that was created but never processed with
        // payslips is a poor report to show by default. Runs through the
        // Payslip model (not DB::table('payroll_runs')) to stay inside
        // BelongsToSchool's tenant scope.
        $latestRunId = Payslip::query()
            ->selectRaw('payroll_run_id, count(*) as payslip_count')
            ->groupBy('payroll_run_id')
            ->orderByDesc('payslip_count')
            ->value('payroll_run_id');

        if (! $latestRunId) {
            return ['columns' => [], 'rows' => []];
        }

        $rows = Payslip::query()
            ->where('payroll_run_id', $latestRunId)
            ->with(['user.staffProfile'])
            ->get()
            ->map(fn (Payslip $p) => [
                'name' => $p->user?->name ?? '—',
                'job_title' => $p->user?->staffProfile?->job_title ?? '—',
                'basic_salary' => number_format((float) $p->basic_salary),
                'allowances' => number_format((float) $p->allowances),
                'deductions' => number_format((float) $p->deductions),
                'net_salary' => number_format((float) $p->net_salary),
                'status' => $p->status,
            ]);

        return [
            'columns' => [
                ['key' => 'name', 'label' => 'Name'],
                ['key' => 'job_title', 'label' => 'Job title'],
                ['key' => 'basic_salary', 'label' => 'Basic'],
                ['key' => 'allowances', 'label' => 'Allowances'],
                ['key' => 'deductions', 'label' => 'Deductions'],
                ['key' => 'net_salary', 'label' => 'Net'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    protected function libraryLoansReport(): array
    {
        $rows = BookLoan::query()
            ->with(['book', 'student'])
            ->orderByDesc('borrowed_at')
            ->get()
            ->map(fn (BookLoan $l) => [
                'book_title' => $l->book?->title ?? '—',
                'student' => $l->student?->full_name ?? '—',
                'borrowed_at' => $l->borrowed_at?->toDateString(),
                'due_date' => $l->due_date?->toDateString(),
                'returned_at' => $l->returned_at?->toDateString() ?? '—',
                'status' => $l->status,
            ]);

        return [
            'columns' => [
                ['key' => 'book_title', 'label' => 'Book'],
                ['key' => 'student', 'label' => 'Student'],
                ['key' => 'borrowed_at', 'label' => 'Borrowed'],
                ['key' => 'due_date', 'label' => 'Due'],
                ['key' => 'returned_at', 'label' => 'Returned'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    protected function inventoryStockReport(): array
    {
        $rows = InventoryItem::query()
            ->orderBy('name')
            ->get()
            ->map(fn (InventoryItem $i) => [
                'name' => $i->name,
                'category' => $i->category ?? '—',
                'quantity' => $i->quantity.' '.($i->unit ?? ''),
                'reorder_level' => $i->reorder_level ?? '—',
                'status' => $i->reorder_level !== null && $i->quantity <= $i->reorder_level ? 'Low stock' : 'OK',
            ]);

        return [
            'columns' => [
                ['key' => 'name', 'label' => 'Item'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'quantity', 'label' => 'Quantity'],
                ['key' => 'reorder_level', 'label' => 'Reorder level'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    protected function hostelOccupancyReport(): array
    {
        $rows = HostelRoom::query()
            ->withCount('activeAllocations')
            ->orderBy('name')
            ->get()
            ->map(fn (HostelRoom $r) => [
                'name' => $r->name,
                'type' => $r->type,
                'occupied' => $r->active_allocations_count,
                'capacity' => $r->capacity,
                'utilization' => $r->capacity > 0 ? round($r->active_allocations_count / $r->capacity * 100).'%' : '—',
            ]);

        return [
            'columns' => [
                ['key' => 'name', 'label' => 'Room'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'occupied', 'label' => 'Occupied'],
                ['key' => 'capacity', 'label' => 'Capacity'],
                ['key' => 'utilization', 'label' => 'Utilization'],
            ],
            'rows' => $rows,
        ];
    }

    protected function transportRosterReport(): array
    {
        $rows = TransportRoute::query()
            ->withCount('activeAssignments')
            ->orderBy('name')
            ->get()
            ->map(fn (TransportRoute $r) => [
                'name' => $r->name,
                'driver_name' => $r->driver_name ?? '—',
                'assigned' => $r->active_assignments_count,
                'capacity' => $r->capacity ?? '—',
                'utilization' => $r->capacity ? round($r->active_assignments_count / $r->capacity * 100).'%' : '—',
            ]);

        return [
            'columns' => [
                ['key' => 'name', 'label' => 'Route'],
                ['key' => 'driver_name', 'label' => 'Driver'],
                ['key' => 'assigned', 'label' => 'Assigned'],
                ['key' => 'capacity', 'label' => 'Capacity'],
                ['key' => 'utilization', 'label' => 'Utilization'],
            ],
            'rows' => $rows,
        ];
    }

    protected function clinicVisitsReport(): array
    {
        $rows = ClinicVisit::query()
            ->with('student')
            ->orderByDesc('visit_date')
            ->get()
            ->map(fn (ClinicVisit $v) => [
                'visit_date' => $v->visit_date?->toDateString(),
                'student' => $v->student?->full_name ?? '—',
                'reason' => $v->reason,
                'diagnosis' => $v->diagnosis ?? '—',
                'treatment' => $v->treatment ?? '—',
            ]);

        return [
            'columns' => [
                ['key' => 'visit_date', 'label' => 'Date'],
                ['key' => 'student', 'label' => 'Student'],
                ['key' => 'reason', 'label' => 'Reason'],
                ['key' => 'diagnosis', 'label' => 'Diagnosis'],
                ['key' => 'treatment', 'label' => 'Treatment'],
            ],
            'rows' => $rows,
        ];
    }
}
