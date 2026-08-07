<?php

use App\Http\Controllers\Api\V1\AuthController as ApiAuthController;
use App\Http\Controllers\Auth\ApiTokenController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Platform\DashboardController as PlatformDashboardController;
use App\Http\Controllers\Platform\SchoolController as PlatformSchoolController;
use App\Http\Controllers\Public\NoticeBoardController;
use App\Http\Controllers\Public\WebsiteController as PublicWebsiteController;
use App\Http\Controllers\Public\WebsiteDownloadController as PublicWebsiteDownloadController;
use App\Http\Controllers\Public\WebsiteTrackingController;
use App\Http\Controllers\WebsiteBuilder\WebsiteAnalyticsController;
use App\Http\Controllers\WebsiteBuilder\WebsiteBannerController;
use App\Http\Controllers\WebsiteBuilder\WebsiteCalendarEventController;
use App\Http\Controllers\WebsiteBuilder\WebsiteDownloadController;
use App\Http\Controllers\WebsiteBuilder\WebsiteFacilityController;
use App\Http\Controllers\WebsiteBuilder\WebsiteGalleryAlbumController;
use App\Http\Controllers\WebsiteBuilder\WebsiteGalleryImageController;
use App\Http\Controllers\WebsiteBuilder\WebsiteNewsController;
use App\Http\Controllers\WebsiteBuilder\WebsiteSectionController;
use App\Http\Controllers\WebsiteBuilder\WebsiteSettingsController;
use App\Http\Controllers\WebsiteBuilder\WebsiteTestimonialController;
use App\Http\Controllers\School\AcademicYearController;
use App\Http\Controllers\School\AiAssistantController;
use App\Http\Controllers\School\AiReportDownloadController;
use App\Http\Controllers\School\ActivityLogController;
use App\Http\Controllers\School\AdmissionApplicationController;
use App\Http\Controllers\School\AdmissionDocumentController;
use App\Http\Controllers\School\AnalyticsController;
use App\Http\Controllers\School\ReportController;
use App\Http\Controllers\School\AnnouncementController;
use App\Http\Controllers\School\AttendanceController;
use App\Http\Controllers\School\BookController;
use App\Http\Controllers\School\BookLoanController;
use App\Http\Controllers\School\BranchController;
use App\Http\Controllers\School\CafeteriaMenuController;
use App\Http\Controllers\School\ClinicVisitController;
use App\Http\Controllers\School\ConversationController;
use App\Http\Controllers\School\CourseController;
use App\Http\Controllers\School\DepartmentController;
use App\Http\Controllers\School\DisciplineIncidentController;
use App\Http\Controllers\School\DocumentController;
use App\Http\Controllers\School\DocumentGeneratorController;
use App\Http\Controllers\School\ExamController;
use App\Http\Controllers\School\ExamEditRequestController;
use App\Http\Controllers\School\ExamResultController;
use App\Http\Controllers\School\ExamSubjectController;
use App\Http\Controllers\School\GradingSystemController;
use App\Http\Controllers\School\GraduationController;
use App\Http\Controllers\School\GuardianImportController;
use App\Http\Controllers\School\GuardianPortalController;
use App\Http\Controllers\School\HolidayController;
use App\Http\Controllers\School\HomeworkController;
use App\Http\Controllers\School\HomeworkSubmissionController;
use App\Http\Controllers\School\HostelAllocationController;
use App\Http\Controllers\School\HostelRoomController;
use App\Http\Controllers\School\InventoryItemController;
use App\Http\Controllers\School\InventoryTransactionController;
use App\Http\Controllers\School\LeaveRequestController;
use App\Http\Controllers\School\LessonController;
use App\Http\Controllers\School\ReportCardController;
use App\Http\Controllers\School\RoomController;
use App\Http\Controllers\School\SchoolClassController;
use App\Http\Controllers\School\SchoolProfileController;
use App\Http\Controllers\School\SchoolUserController;
use App\Http\Controllers\School\StaffAttendanceController;
use App\Http\Controllers\School\StaffContractController;
use App\Http\Controllers\School\StaffProfileController;
use App\Http\Controllers\School\StreamController;
use App\Http\Controllers\School\StudentController;
use App\Http\Controllers\School\StudentDocumentController;
use App\Http\Controllers\School\StudentEnrollmentController;
use App\Http\Controllers\School\StudentGuardianController;
use App\Http\Controllers\School\StudentImportController;
use App\Http\Controllers\School\SubjectController;
use App\Http\Controllers\School\TeacherImportController;
use App\Http\Controllers\School\TermController;
use App\Http\Controllers\School\TimetableEntryController;
use App\Http\Controllers\School\TimetablePeriodController;
use App\Http\Controllers\School\TransportAssignmentController;
use App\Http\Controllers\School\TransportRouteController;
use App\Http\Controllers\ParentPortal\ParentPortalController;
use App\Http\Controllers\Finance\BudgetController;
use App\Http\Controllers\Finance\ExpenseCategoryController;
use App\Http\Controllers\Finance\ExpenseController;
use App\Http\Controllers\Finance\FeeCategoryController;
use App\Http\Controllers\Finance\FeeStructureController;
use App\Http\Controllers\Finance\InvoiceController;
use App\Http\Controllers\Finance\PaymentController;
use App\Http\Controllers\Finance\PayrollRunController;
use App\Http\Controllers\Finance\PayslipController;
use App\Http\Controllers\Finance\StaffSalaryController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/auth/activate-account', [AuthController::class, 'activate']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

// The entire school route surface is shared verbatim between the SPA
// (session-cookie, 'auth:web' below) and the versioned public API
// (personal-access-token, 'auth.token' further down) — every controller in
// here reads $request->user() and never touches the 'web' guard directly,
// so it's equally correct under either auth mechanism. See
// App\Http\Middleware\ResolveTenantFromUser and
// App\Http\Middleware\EnsureApiTokenAuthenticated for how token requests
// get a correctly-resolved $request->user() without ever flipping the
// default auth guard (that's what breaks Spatie permission checks).
$schoolRoutes = function () {
    Route::get('profile', [SchoolProfileController::class, 'show']);
        Route::put('profile', [SchoolProfileController::class, 'update']);

        Route::apiResource('branches', BranchController::class);
        Route::apiResource('departments', DepartmentController::class);

        Route::apiResource('academic-years', AcademicYearController::class);
        Route::apiResource('academic-years.terms', TermController::class)->shallow();
        Route::apiResource('holidays', HolidayController::class);

        Route::apiResource('classes', SchoolClassController::class);
        Route::put('classes/{class}/subjects', [SchoolClassController::class, 'syncSubjects']);
        Route::apiResource('streams', StreamController::class);
        Route::apiResource('rooms', RoomController::class);

        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('grading-systems', GradingSystemController::class);

        Route::get('roles', [SchoolUserController::class, 'availableRoles']);
        Route::apiResource('users', SchoolUserController::class);

        // Students
        Route::apiResource('students', StudentController::class);
        Route::post('students/import', [StudentImportController::class, 'import']);
        Route::post('students/{student}/guardians', [StudentGuardianController::class, 'store']);
        Route::delete('students/{student}/guardians/{guardian}', [StudentGuardianController::class, 'destroy']);
        Route::post('guardians/import', [GuardianImportController::class, 'import']);
        Route::get('students/{student}/enrollments', [StudentEnrollmentController::class, 'index']);
        Route::post('students/{student}/enrollments', [StudentEnrollmentController::class, 'store']);
        Route::get('students/{student}/documents', [StudentDocumentController::class, 'index']);
        Route::post('students/{student}/documents', [StudentDocumentController::class, 'store']);
        Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
        Route::get('students/{student}/certificate', [DocumentGeneratorController::class, 'studentCertificate']);
        Route::get('students/{student}/transcript', [DocumentGeneratorController::class, 'studentTranscript']);

        // Discipline
        Route::apiResource('discipline-incidents', DisciplineIncidentController::class)->except(['show']);

        // Graduation / leaver & transfer records
        Route::get('graduation/eligible', [GraduationController::class, 'eligible']);
        Route::post('graduation/batch', [GraduationController::class, 'batch']);
        Route::get('graduation/history', [GraduationController::class, 'history']);

        // Staff / Teachers (HR)
        Route::apiResource('staff', StaffProfileController::class);
        Route::post('staff/import', [TeacherImportController::class, 'import']);
        Route::put('staff/{staff}/subjects', [StaffProfileController::class, 'syncSubjects']);
        Route::put('staff/{staff}/classes', [StaffProfileController::class, 'syncClasses']);
        Route::get('staff/{staff}/contracts', [StaffContractController::class, 'index']);
        Route::post('staff-contracts', [StaffContractController::class, 'store']);
        Route::delete('staff-contracts/{contract}', [StaffContractController::class, 'destroy']);
        Route::get('staff-contracts/{contract}/document', [DocumentGeneratorController::class, 'staffContract']);

        Route::apiResource('leave-requests', LeaveRequestController::class)->only(['index', 'store', 'destroy']);
        Route::post('leave-requests/{leaveRequest}/review', [LeaveRequestController::class, 'review']);

        // Staff attendance
        Route::get('staff-attendance/register', [StaffAttendanceController::class, 'register']);
        Route::post('staff-attendance', [StaffAttendanceController::class, 'store']);

        // Admissions
        Route::apiResource('admissions', AdmissionApplicationController::class)->except(['destroy']);
        Route::post('admissions/{admission}/accept', [AdmissionApplicationController::class, 'accept']);
        Route::post('admissions/{admission}/reject', [AdmissionApplicationController::class, 'reject']);
        Route::post('admissions/{admission}/enroll', [AdmissionApplicationController::class, 'enroll']);
        Route::get('admissions/{admission}/documents', [AdmissionDocumentController::class, 'index']);
        Route::post('admissions/{admission}/documents', [AdmissionDocumentController::class, 'store']);

        // Attendance
        Route::get('attendance/register', [AttendanceController::class, 'register']);
        Route::post('attendance', [AttendanceController::class, 'store']);
        Route::get('students/{student}/attendance', [AttendanceController::class, 'history']);

        // Timetable
        Route::apiResource('timetable-periods', TimetablePeriodController::class)->except(['show']);
        Route::apiResource('timetable-entries', TimetableEntryController::class)->except(['show']);

        // Homework
        Route::apiResource('homeworks', HomeworkController::class);
        Route::put('homework-submissions/{submission}', [HomeworkSubmissionController::class, 'update']);

        // Communication
        Route::apiResource('announcements', AnnouncementController::class)->except(['show']);
        Route::get('conversations', [ConversationController::class, 'index']);
        Route::post('conversations', [ConversationController::class, 'store']);
        Route::get('conversations/{conversation}/messages', [ConversationController::class, 'messages']);
        Route::post('conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);

        // Examination System
        Route::apiResource('exams', ExamController::class);
        Route::put('exams/{exam}/status', [ExamController::class, 'updateStatus']);
        Route::post('exams/{exam}/subjects', [ExamSubjectController::class, 'store']);
        Route::get('exam-subjects/{examSubject}', [ExamSubjectController::class, 'show']);
        Route::delete('exam-subjects/{examSubject}', [ExamSubjectController::class, 'destroy']);
        Route::get('exam-subjects/{examSubject}/results', [ExamSubjectController::class, 'results']);
        Route::put('exam-subjects/{examSubject}/results', [ExamResultController::class, 'update']);
        Route::post('exam-subjects/{examSubject}/submit', [ExamSubjectController::class, 'submit']);
        Route::apiResource('exam-edit-requests', ExamEditRequestController::class)->only(['index', 'store', 'destroy']);
        Route::post('exam-edit-requests/{examEditRequest}/review', [ExamEditRequestController::class, 'review']);
        Route::get('students/{student}/report-card', [ReportCardController::class, 'show']);
        Route::get('students/{student}/report-card/pdf', [ReportCardController::class, 'pdf']);
        Route::put('exams/{exam}/students/{student}/remark', [ReportCardController::class, 'setRemark']);
        Route::get('exams/{exam}/report-cards/ranking', [ReportCardController::class, 'ranking']);
        Route::get('exams/{exam}/report-cards/pdf', [ReportCardController::class, 'bulkPdf']);
        Route::get('exams/{exam}/report-cards/class-summary', [ReportCardController::class, 'classSummary']);
        Route::get('exams/{exam}/teacher-performance', [ReportCardController::class, 'teacherPerformance']);

        // LMS
        Route::apiResource('courses', CourseController::class);
        Route::post('courses/{course}/lessons', [LessonController::class, 'store']);
        Route::put('lessons/{lesson}', [LessonController::class, 'update']);
        Route::delete('lessons/{lesson}', [LessonController::class, 'destroy']);

        // Parent Portal access grant
        Route::post('guardians/{guardian}/portal-access', [GuardianPortalController::class, 'store']);

        // Finance: fees & billing
        Route::apiResource('fee-categories', FeeCategoryController::class)->except(['show']);
        Route::apiResource('fee-structures', FeeStructureController::class)->except(['show']);
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::post('invoices/generate', [InvoiceController::class, 'generate']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy']);
        Route::post('invoices/{invoice}/payments', [PaymentController::class, 'store']);

        // Finance: payroll
        Route::apiResource('staff-salaries', StaffSalaryController::class)->except(['show']);
        Route::apiResource('payroll-runs', PayrollRunController::class)->except(['update']);
        Route::post('payroll-runs/{payroll_run}/process', [PayrollRunController::class, 'process']);
        Route::post('payslips/{payslip}/mark-paid', [PayslipController::class, 'markPaid']);

        // Finance: expenses
        Route::apiResource('expense-categories', ExpenseCategoryController::class)->except(['show']);
        Route::apiResource('expenses', ExpenseController::class)->except(['show']);

        // Finance: budgets
        Route::apiResource('budgets', BudgetController::class)->except(['show']);

        // Facilities: library
        Route::apiResource('books', BookController::class);
        Route::get('book-loans', [BookLoanController::class, 'index']);
        Route::post('books/{book}/loans', [BookLoanController::class, 'store']);
        Route::post('book-loans/{loan}/return', [BookLoanController::class, 'return']);

        // Facilities: hostel
        Route::apiResource('hostel-rooms', HostelRoomController::class)->except(['show']);
        Route::get('hostel-allocations', [HostelAllocationController::class, 'index']);
        Route::post('hostel-allocations', [HostelAllocationController::class, 'store']);
        Route::post('hostel-allocations/{allocation}/vacate', [HostelAllocationController::class, 'vacate']);

        // Facilities: transport
        Route::apiResource('transport-routes', TransportRouteController::class)->except(['show']);
        Route::get('transport-assignments', [TransportAssignmentController::class, 'index']);
        Route::post('transport-assignments', [TransportAssignmentController::class, 'store']);
        Route::post('transport-assignments/{assignment}/unassign', [TransportAssignmentController::class, 'unassign']);

        // Facilities: inventory
        Route::apiResource('inventory-items', InventoryItemController::class)->except(['show']);
        Route::get('inventory-transactions', [InventoryTransactionController::class, 'index']);
        Route::post('inventory-transactions', [InventoryTransactionController::class, 'store']);

        // Facilities: clinic & cafeteria
        Route::apiResource('clinic-visits', ClinicVisitController::class)->except(['show']);
        Route::apiResource('cafeteria-menus', CafeteriaMenuController::class)->except(['show']);

        // Analytics
        Route::get('analytics/overview', [AnalyticsController::class, 'overview']);
        Route::get('analytics/enrollment', [AnalyticsController::class, 'enrollment']);
        Route::get('analytics/attendance', [AnalyticsController::class, 'attendance']);
        Route::get('analytics/academics', [AnalyticsController::class, 'academics']);
        Route::get('analytics/finance', [AnalyticsController::class, 'finance']);
        Route::get('analytics/budget', [AnalyticsController::class, 'budget']);
        Route::get('analytics/staff-attendance', [AnalyticsController::class, 'staffAttendance']);
        Route::get('analytics/by-branch', [AnalyticsController::class, 'byBranch']);

        // Report library
        Route::get('reports', [ReportController::class, 'catalog']);
        Route::get('reports/{key}', [ReportController::class, 'show']);

        // Audit trail
        Route::get('activity-logs', [ActivityLogController::class, 'index']);
        Route::get('activity-log-subject-types', [ActivityLogController::class, 'subjectTypes']);

        // AI Assistant
        Route::get('ai-assistant/status', [AiAssistantController::class, 'status']);
        Route::post('ai-assistant/chat', [AiAssistantController::class, 'chat'])->middleware('throttle:ai-assistant');
        Route::post('ai-assistant/lesson-plan', [AiAssistantController::class, 'lessonPlan'])->middleware('throttle:ai-assistant');

        // Signed on top of the surrounding auth:web + password.changed group
        // — the signature alone proves this exact URL was legitimately
        // issued, not that the current session still has permission, so the
        // controller re-verifies ownership/status/expiry itself regardless.
        Route::get('ai-reports/{report}/download', [AiReportDownloadController::class, 'download'])
            ->middleware('signed')
            ->name('ai.reports.download');

        // Website Builder (Premium) CMS — 'website-builder.access' checks
        // BOTH the website-builder.manage permission AND the school's
        // website_enabled premium grant before any of these run. See
        // App\Http\Middleware\EnsureWebsiteBuilderAccess.
        Route::middleware('website-builder.access')->prefix('website-builder')->group(function () {
            Route::get('settings', [WebsiteSettingsController::class, 'show']);
            Route::put('settings', [WebsiteSettingsController::class, 'update']);
            Route::post('settings/hero-media', [WebsiteSettingsController::class, 'uploadHero']);

            Route::get('sections', [WebsiteSectionController::class, 'index']);
            Route::put('sections', [WebsiteSectionController::class, 'update']);

            Route::apiResource('facilities', WebsiteFacilityController::class)->only(['index', 'store', 'update', 'destroy']);

            Route::apiResource('gallery-albums', WebsiteGalleryAlbumController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::post('gallery-albums/{galleryAlbum}/images', [WebsiteGalleryImageController::class, 'store']);
            Route::put('gallery-images/{image}', [WebsiteGalleryImageController::class, 'update']);
            Route::delete('gallery-images/{image}', [WebsiteGalleryImageController::class, 'destroy']);

            Route::apiResource('banners', WebsiteBannerController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('testimonials', WebsiteTestimonialController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('downloads', WebsiteDownloadController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('calendar-events', WebsiteCalendarEventController::class)->only(['index', 'store', 'update', 'destroy']);

            Route::get('news', [WebsiteNewsController::class, 'index']);
            Route::put('news/{news}', [WebsiteNewsController::class, 'update']);

            Route::get('analytics/summary', [WebsiteAnalyticsController::class, 'summary']);
        });
};

$parentRoutes = function () {
    Route::get('children', [ParentPortalController::class, 'children']);
    // {qrCode} is deliberately a plain string, not route-model-bound — see
    // ParentPortalController::scan() for why.
    Route::get('scan/{qrCode}', [ParentPortalController::class, 'scan']);
    Route::get('children/{student}/attendance', [ParentPortalController::class, 'attendance']);
    Route::get('children/{student}/homework', [ParentPortalController::class, 'homework']);
    Route::get('children/{student}/results', [ParentPortalController::class, 'results']);
    Route::get('children/{student}/fees', [ParentPortalController::class, 'fees']);
    Route::get('children/{student}/invoices/{invoice}', [ParentPortalController::class, 'invoice']);
    Route::get('announcements', [ParentPortalController::class, 'announcements']);

    // Read/reply only — parents never start a conversation (see
    // ConversationController::store), only reply within one an admin
    // already started with them.
    Route::get('conversations', [ConversationController::class, 'index']);
    Route::get('conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);
};

// auth:web (not auth:sanctum) — this app is SPA-cookie-auth only for this
// group. auth:sanctum would switch the default guard to 'sanctum' mid-request
// (via Authenticate::authenticate() -> $auth->shouldUse('sanctum')), which
// breaks Spatie permission checks: our roles/permissions are seeded with
// guard_name 'web', so $user->can(...) silently fails once the default
// guard becomes 'sanctum'. Token-based clients use the 'v1' group below
// instead, which authenticates via the 'sanctum' guard directly without
// ever calling shouldUse() — see EnsureApiTokenAuthenticated.
Route::middleware('auth:web')->group(function () use ($schoolRoutes, $parentRoutes) {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    // Reachable even while must_change_password is true — it's the one way
    // out of that state. Everything below the password.changed gate isn't.
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::middleware('password.changed')->group(function () use ($schoolRoutes, $parentRoutes) {
        // Self-service API key management — mint/revoke personal access
        // tokens for the 'v1' group below, from the dashboard.
        Route::apiResource('tokens', ApiTokenController::class)->only(['index', 'store', 'destroy']);

        Route::middleware('role:Super Admin')->prefix('platform')->group(function () {
            Route::get('dashboard', [PlatformDashboardController::class, 'index']);
            Route::apiResource('schools', PlatformSchoolController::class);
            Route::post('schools/{school}/approve', [PlatformSchoolController::class, 'approve']);
            Route::post('schools/{school}/suspend', [PlatformSchoolController::class, 'suspend']);
            Route::post('schools/{school}/renew-license', [PlatformSchoolController::class, 'renewLicense']);
            Route::post('schools/{school}/custom-domain', [PlatformSchoolController::class, 'setCustomDomain']);
            Route::post('schools/{school}/ai-access/grant', [PlatformSchoolController::class, 'grantAiAccess']);
            Route::post('schools/{school}/ai-access/suspend', [PlatformSchoolController::class, 'suspendAiAccess']);
            Route::post('schools/{school}/ai-access/reactivate', [PlatformSchoolController::class, 'reactivateAiAccess']);
            Route::post('schools/{school}/ai-access/revoke', [PlatformSchoolController::class, 'revokeAiAccess']);
            Route::post('schools/{school}/website-access/grant', [PlatformSchoolController::class, 'grantWebsiteAccess']);
            Route::post('schools/{school}/website-access/suspend', [PlatformSchoolController::class, 'suspendWebsiteAccess']);
            Route::post('schools/{school}/website-access/reactivate', [PlatformSchoolController::class, 'reactivateWebsiteAccess']);
            Route::post('schools/{school}/website-access/revoke', [PlatformSchoolController::class, 'revokeWebsiteAccess']);
            Route::post('schools/{school}/enter', [PlatformSchoolController::class, 'enter']);
            Route::post('exit-school', [PlatformSchoolController::class, 'exitSchool']);
        });

        Route::prefix('school')->group($schoolRoutes);

        Route::middleware('role:Parent')->prefix('parent')->group($parentRoutes);
    });
});

// Versioned public API — personal-access-token clients (mobile apps,
// third-party integrations) that can't do the SPA's cookie-based auth.
// Same $schoolRoutes/$parentRoutes closures as the SPA group above, so
// this is never at risk of silently drifting out of sync with what the
// dashboard can do — access is still governed by the token holder's own
// Spatie role/permissions, resolved the same way regardless of auth
// mechanism (see the comment on the 'auth:web' group above).
Route::prefix('v1')->group(function () use ($schoolRoutes, $parentRoutes) {
    Route::post('/auth/login', [ApiAuthController::class, 'login'])->middleware('throttle:api-token-login');

    Route::middleware(['auth.token', 'throttle:api-token'])->group(function () use ($schoolRoutes, $parentRoutes) {
        Route::post('/auth/logout', [ApiAuthController::class, 'logout']);
        Route::get('/auth/me', [ApiAuthController::class, 'me']);

        Route::prefix('school')->name('v1.')->group($schoolRoutes);
        Route::middleware('role:Parent')->prefix('parent')->group($parentRoutes);
    });
});

// Public Notice Board — deliberately outside auth:web/auth.token entirely,
// no login of any kind. See NoticeBoardController for why {exam} and
// {schoolClass} below are plain strings rather than route-model-bound:
// binding would run before the school (and therefore the tenant) is known.
Route::prefix('public/schools/{slug}/notice-board')->middleware('throttle:notice-board')->group(function () {
    Route::get('exams', [NoticeBoardController::class, 'exams']);
    Route::get('exams/{examId}/classes', [NoticeBoardController::class, 'classes']);
    Route::get('exams/{examId}/classes/{schoolClassId}/ranking', [NoticeBoardController::class, 'ranking']);
});

// Public school website (Website Builder premium module) — same
// no-login-at-all shape as the Notice Board above. Path-based for now
// (public/site/{slug}), not a subdomain: schoolname.schoolhub.co.tz needs
// wildcard DNS + SSL that isn't provisioned yet. See Public\WebsiteController
// for the 404 conditions (module not granted, or granted but unpublished).
Route::prefix('public/site/{slug}')->middleware('throttle:public-website')->group(function () {
    Route::get('/', [PublicWebsiteController::class, 'show']);
    Route::post('track', [WebsiteTrackingController::class, 'track'])->middleware('throttle:public-website-track');
    Route::get('downloads/{downloadId}', [PublicWebsiteDownloadController::class, 'show']);
});
