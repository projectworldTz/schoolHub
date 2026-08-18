import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ActivateAccountPage } from '@/pages/auth/ActivateAccountPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { SchoolsPage } from '@/pages/platform/SchoolsPage'
import { PlatformDashboardPage } from '@/pages/platform/PlatformDashboardPage'
import { DashboardPage } from '@/pages/school/DashboardPage'
import { SettingsPage } from '@/pages/school/SettingsPage'
import { AcademicSetupPage } from '@/pages/school/AcademicSetupPage'
import { ClassesPage } from '@/pages/school/ClassesPage'
import { AcademicsPage } from '@/pages/school/AcademicsPage'
import { UsersPage } from '@/pages/school/UsersPage'
import { StudentsPage } from '@/pages/school/StudentsPage'
import { StudentDetailPage } from '@/pages/school/StudentDetailPage'
import { StaffPage } from '@/pages/school/StaffPage'
import { AdmissionsPage } from '@/pages/school/AdmissionsPage'
import { AttendancePage } from '@/pages/school/AttendancePage'
import { DisciplinePage } from '@/pages/school/DisciplinePage'
import { GraduationPage } from '@/pages/school/GraduationPage'
import { PromotionsPage } from '@/pages/school/PromotionsPage'
import { MessagesPage } from '@/pages/school/MessagesPage'
import { TimetablePage } from '@/pages/school/TimetablePage'
import { HomeworkListPage, HomeworkDetailPage } from '@/pages/school/HomeworkPage'
import { CommunicationPage } from '@/pages/school/CommunicationPage'
import { ExamsPage } from '@/pages/school/ExamsPage'
import { ExamDetailPage } from '@/pages/school/ExamDetailPage'
import { GradebookPage } from '@/pages/school/GradebookPage'
import { LmsPage } from '@/pages/school/LmsPage'
import { CourseDetailPage } from '@/pages/school/CourseDetailPage'
import { FinancePage } from '@/pages/school/FinancePage'
import { InvoiceDetailPage } from '@/pages/school/InvoiceDetailPage'
import { PayrollPage } from '@/pages/school/PayrollPage'
import { PayrollRunDetailPage } from '@/pages/school/PayrollRunDetailPage'
import { ExpensesPage } from '@/pages/school/ExpensesPage'
import { LibraryPage } from '@/pages/school/LibraryPage'
import { HostelPage } from '@/pages/school/HostelPage'
import { TransportPage } from '@/pages/school/TransportPage'
import { InventoryPage } from '@/pages/school/InventoryPage'
import { ClinicPage } from '@/pages/school/ClinicPage'
import { CafeteriaPage } from '@/pages/school/CafeteriaPage'
import { AnalyticsPage } from '@/pages/school/AnalyticsPage'
import { ReportLibraryPage } from '@/pages/school/ReportLibraryPage'
import { ReportDetailPage } from '@/pages/school/ReportDetailPage'
import { AuditLogPage } from '@/pages/school/AuditLogPage'
import { AiAssistantPage } from '@/pages/school/AiAssistantPage'
import { WebsiteBuilderPage } from '@/pages/school/WebsiteBuilderPage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ParentInvoiceDetailPage } from '@/pages/parent/InvoiceDetailPage'
import { ScanStudentPage } from '@/pages/parent/ScanStudentPage'
import { NoticeBoardPage } from '@/pages/public/NoticeBoardPage'
import { SchoolWebsitePage } from '@/pages/public/SchoolWebsitePage'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { AppShell } from '@/components/layout/AppShell'
import { ParentLayout } from '@/components/layout/ParentLayout'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { HomeRedirect } from '@/routes/HomeRedirect'

function App() {
  return (
    <>
      <OfflineBanner />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/notice-board/:slug" element={<NoticeBoardPage />} />
      <Route path="/site/:slug" element={<SchoolWebsitePage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        <Route element={<ProtectedRoute requireRole="Super Admin" />}>
          <Route element={<PlatformLayout />}>
            <Route path="/platform/dashboard" element={<PlatformDashboardPage />} />
            <Route path="/platform/schools" element={<SchoolsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requireRole="Parent" />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
            <Route path="/parent/students/:studentId/invoices/:invoiceId" element={<ParentInvoiceDetailPage />} />
            <Route path="/scan/:qrCode" element={<ScanStudentPage />} />
          </Route>
        </Route>

        <Route element={<AppShell />}>
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="/app/academic-setup" element={<AcademicSetupPage />} />
          <Route path="/app/classes" element={<ClassesPage />} />
          <Route path="/app/academics" element={<AcademicsPage />} />
          <Route path="/app/students" element={<StudentsPage />} />
          <Route path="/app/students/:id" element={<StudentDetailPage />} />
          <Route path="/app/staff" element={<StaffPage />} />
          <Route path="/app/admissions" element={<AdmissionsPage />} />
          <Route path="/app/attendance" element={<AttendancePage />} />
          <Route path="/app/discipline" element={<DisciplinePage />} />
          <Route path="/app/graduation" element={<GraduationPage />} />
          <Route path="/app/promotions" element={<PromotionsPage />} />
          <Route path="/app/messages" element={<MessagesPage />} />
          <Route path="/app/timetable" element={<TimetablePage />} />
          <Route path="/app/homework" element={<HomeworkListPage />} />
          <Route path="/app/homework/:id" element={<HomeworkDetailPage />} />
          <Route path="/app/communication" element={<CommunicationPage />} />
          <Route path="/app/exams" element={<ExamsPage />} />
          <Route path="/app/exams/:id" element={<ExamDetailPage />} />
          <Route path="/app/exam-subjects/:id" element={<GradebookPage />} />
          <Route path="/app/courses" element={<LmsPage />} />
          <Route path="/app/courses/:id" element={<CourseDetailPage />} />
          <Route path="/app/finance" element={<FinancePage />} />
          <Route path="/app/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/app/payroll" element={<PayrollPage />} />
          <Route path="/app/payroll-runs/:id" element={<PayrollRunDetailPage />} />
          <Route path="/app/expenses" element={<ExpensesPage />} />
          <Route path="/app/library" element={<LibraryPage />} />
          <Route path="/app/hostel" element={<HostelPage />} />
          <Route path="/app/transport" element={<TransportPage />} />
          <Route path="/app/inventory" element={<InventoryPage />} />
          <Route path="/app/clinic" element={<ClinicPage />} />
          <Route path="/app/cafeteria" element={<CafeteriaPage />} />
          <Route path="/app/analytics" element={<AnalyticsPage />} />
          <Route path="/app/reports" element={<ReportLibraryPage />} />
          <Route path="/app/reports/:key" element={<ReportDetailPage />} />
          <Route path="/app/audit-log" element={<AuditLogPage />} />
          <Route path="/app/ai-assistant" element={<AiAssistantPage />} />
          <Route path="/app/website-builder" element={<WebsiteBuilderPage />} />
          <Route path="/app/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
