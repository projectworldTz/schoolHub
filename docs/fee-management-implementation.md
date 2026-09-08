# Per-school Fee Management and school detail page

Implemented: selecting a school from Platform > Schools opens `/platform/schools/:id`, with school details and separate Fee Management, AI Assistant, and Public Website cards. The existing AI and website grant/adjust/suspend/reactivate/revoke flows are retained. School list pagination makes every school reachable.

## Database change

Added `2026_09_08_120000_add_fee_management_enabled_to_schools_table.php`: one non-null boolean column, `schools.fee_management_enabled`, defaulting to `true`. Existing schools and new schools retain fee access. This uses the existing school-level feature architecture. The model has the same default.

The migration has only been executed against the in-memory SQLite test database. No application/production database migration was run. No fee, payment, invoice, balance, receipt, or structure records are changed by this migration or by the toggle. Rolling back removes only the new setting column.

## Backend and tenant isolation

- Only the Super Admin platform route and `SchoolPolicy::manageFees` authorize `PUT /api/platform/schools/{school}/fee-management`. Input must contain a boolean `fee_management_enabled`; normal school profile updates cannot set it.
- `FeeManagementAccess` reads the school from the existing authenticated `Tenant::id()` context, including authorized Super Admin school impersonation. Request-body/query school IDs never select the feature state.
- `EnsureFeeManagementEnabled` guards fee categories/structures, invoices/import/generation/PDFs, payments/reversals, fee exclusions, payment accounts, finance analytics, and parent fee/invoice endpoints. Both session routes and `/api/v1` token routes share the guard. Existing tenant model scopes and permissions remain active.
- Disabled access returns HTTP 403. Mixed dashboards omit fee calculations and payment activity; report catalogs omit fee collection. Direct fee report requests, AI fee tools/exports, and downloads of generated fee reports are protected.
- Payroll, expenses, and unrelated school modules retain their own routes and permissions.

## Frontend behavior

- Fee switch on the dedicated school page is available for every school; saves refresh the school detail/list and authenticated feature state.
- Fee navigation, Quick Add, search results, dashboard cards, student fee exclusions, settings payment accounts, finance analytics, parent balances/payment details, and fee-related AI suggestions are hidden when disabled.
- Fee page URLs show an unavailable message. Fee queries used on mixed dashboards/parent screens are disabled. Hidden balances are not presented as zero balances.
- Active clients refresh authenticated feature state every 30 seconds and on window focus; backend enforcement applies on each new fee request immediately.
- Entering/exiting a school clears school and parent query caches before navigation, preventing the previous school's cached data from following the platform admin.

## Validation

- New backend feature coverage: 6 tests, 51 assertions passed (default preservation, migration preservation, off/on financial table snapshots, school isolation, direct read/write/PDF/import/reversal protection, parent/token access, authorization, dashboard fee-query exclusion, and token-login feature state).
- Frontend suite: 4 files, 28 tests passed, including disabled fees with enabled payroll and Super Admin behavior.
- TypeScript and production Vite/PWA build passed. Final build refreshed the tracked `frontend/dist` assets.
- Frontend lint passed with six existing Fast Refresh warnings in shared UI components.
- Backend regressions: 24 tests, 90 assertions passed across StudentFeeExclusionTest, FeeReportPdfTest, PlatformSchoolManagementTest, SchoolPaymentAccountTest, and PlatformSchoolImpersonationTest. Total backend coverage run: 30 tests, 141 assertions.

## Deployment and remaining considerations

Deploy the backend migration before exposing the updated application, using the existing deployment procedure. The migration was tested with SQLite; validate it against the deployment database in staging before production rollout. The existing offline cache can retain information already downloaded before a feature is disabled; offline clients cannot receive a new feature state until they reconnect. No live browser interaction or production-database test was performed. The production build retains the existing large-bundle warning.

## Files added or modified

- `backend/app/Http/Controllers/Api/V1/AuthController.php`
- `backend/app/Http/Controllers/Platform/SchoolController.php`
- `backend/app/Http/Controllers/School/AiReportDownloadController.php`
- `backend/app/Http/Controllers/School/AnalyticsController.php`
- `backend/app/Http/Controllers/School/ReportController.php`
- `backend/app/Http/Middleware/EnsureFeeManagementEnabled.php`
- `backend/app/Http/Requests/Platform/SetSchoolFeeManagementRequest.php`
- `backend/app/Http/Resources/Platform/SchoolResource.php`
- `backend/app/Http/Resources/UserResource.php`
- `backend/app/Models/School.php`
- `backend/app/Policies/SchoolPolicy.php`
- `backend/app/Services/AI/Reports/Types/OutstandingFeesReport.php`
- `backend/app/Services/AI/Tools/OutstandingFeesTool.php`
- `backend/app/Services/Finance/FeeManagementAccess.php`
- `backend/app/Services/Platform/SchoolService.php`
- `backend/database/migrations/2026_09_08_120000_add_fee_management_enabled_to_schools_table.php`
- `backend/routes/api.php`
- `backend/tests/Feature/FeeManagementAccessTest.php`
- `frontend/src/App.tsx`
- `frontend/src/api/schools.ts`
- `frontend/src/components/layout/CommandPalette.tsx`
- `frontend/src/hooks/useAnalytics.ts`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/hooks/useCrud.ts`
- `frontend/src/hooks/useFeeManagement.ts`
- `frontend/src/hooks/useFinance.ts`
- `frontend/src/hooks/useParentPortal.ts`
- `frontend/src/hooks/useSchools.ts`
- `frontend/src/lib/permissions.test.ts`
- `frontend/src/lib/permissions.ts`
- `frontend/src/pages/parent/ParentDashboardPage.tsx`
- `frontend/src/pages/parent/ScanStudentPage.tsx`
- `frontend/src/pages/platform/SchoolDetailPage.tsx`
- `frontend/src/pages/platform/SchoolsPage.tsx`
- `frontend/src/pages/school/AiAssistantPage.tsx`
- `frontend/src/pages/school/AnalyticsPage.tsx`
- `frontend/src/pages/school/DashboardPage.tsx`
- `frontend/src/pages/school/SettingsPage.tsx`
- `frontend/src/pages/school/StudentDetailPage.tsx`
- `frontend/src/routes/ProtectedRoute.tsx`
- `frontend/src/types/auth.ts`
- `frontend/src/types/school.ts`

This report: `docs/fee-management-implementation.md`.

Generated assets: updated frontend/dist index, application JavaScript bundle, and service worker.


## Disabled-fee visibility follow-up

Confirmed St Josephs Secondary has fees disabled and its invoice endpoint returns HTTP 403, including for a Super Admin viewing that school. The remaining Finance heading contained only Expenses and Budgets; it now reads Expenses when fee access is unavailable, in both desktop and mobile navigation. Search no longer advertises invoices, and the dashboard activity description omits payments while fees are disabled.

Shared navigation filtering now removes empty groups. A cached user without a known feature state cannot expose fees. The persisted-cache version was bumped, entering/exiting a school fetches fresh auth data before navigation, and a saved toggle immediately updates matching active-school auth state. Regression coverage: 32 frontend tests passed, including enabled/disabled navigation, Super Admin access, and stale cached users.
