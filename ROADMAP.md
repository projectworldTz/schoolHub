# SchoolHub Africa — Build Roadmap

29 modules is not a one-pass build. This roadmap sequences them so each phase is usable and
testable before the next depends on it. Order can be renegotiated, but later phases genuinely
depend on earlier ones (e.g. Finance needs Student Management; Timetable needs Class Management).

## Phase 0 — Foundation (done)
- Monorepo scaffold (Laravel 12 backend, React 19 + TS frontend)
- Multi-tenancy: `schools` table, `school_id` Eloquent global scope (MySQL — no RLS backstop, see `App\Support\Tenancy\Tenant`)
- Auth: Sanctum SPA auth
- RBAC: Spatie roles/permissions seeded for all defined roles (teams feature off — see `config/permission.php`)
- Super Admin (Platform): school registry — register, approve, suspend

## Phase 1 — Core school setup (done)
- School Management: profile, branches, departments, academic years, terms, holidays
- User & Role management UI (create staff, assign roles per school)
- Class Management: classes, streams, capacity, room allocation
- Academic Management: subjects, curriculum (class↔subject mapping), grading systems
- School calendar (calendar *view* of terms/holidays) deferred — the data model (terms, holidays)
  exists; a dedicated calendar UI isn't built yet
- Learning Outcomes / Competencies deferred to Phase 4 (LMS) — they belong with lesson/assessment
  design, not foundational academic setup

## Phase 2 — People (done)
- Student Management: profiles, guardians (attach existing or create new), enrollment history,
  document upload (polymorphic `Document` model, reused by staff/admissions too), auto-generated QR code
- Teacher Management: unified `StaffProfile` (covers teachers + other staff), subject assignment,
  contracts
- Employee Management (HR): staff contracts, leave requests (self-service create/cancel,
  manager approve/reject)
- Admissions: applications, document upload, accept/reject, enroll → creates Student + Guardian +
  StudentEnrollment in one transaction
- ID cards deferred to the Document Generator (Phase 7) — QR code the ID card will encode already
  exists on the student record

## Phase 3 — Daily operations (done)
- Attendance: daily class register (manual marking), one row per student per day. QR/barcode capture
  deferred — it's a device/camera-integration project in its own right, not a CRUD extension;
  biometric/face recognition stays deferred per the original plan.
- Timetable Management: periods, weekly class grid, teacher/room/class conflict detection
  (app-level — MySQL's unique index can't express the NULL-stream case, see the migration comment)
- Homework & Assignments: teacher assigns to a class, a submission row is auto-created per
  actively-enrolled student (status 'pending'), teacher grades/updates status
- Communication: announcements (school/class/role audience) — in-app only. Email/SMS/WhatsApp
  dispatch needs a provider integration (SMTP, Africa's Talking/Twilio, WhatsApp Business API), the
  same way Phase 5 payment gateways need Stripe/Flutterwave/M-Pesa credentials — deferred until
  those are supplied.
- Student/parent self-service views (e.g. "my attendance", "my homework") deferred to the Parent
  Portal in Phase 4, which is the first consumer that actually needs them

## Phase 4 — Academics & assessment (done)
- Examination System: exams → class/subject gradebooks → marks entry → grade auto-computed from the
  school's default grading system bands → per-student report cards. Online question banks / CBT
  deferred to LMS quizzes (below) to avoid two overlapping scored-assessment systems.
- LMS: courses (subject + optional class + teacher) and lessons (ordered content). Quizzes and
  certificates deferred — quizzes need a scoring engine of their own and certificates depend on the
  Document Generator (Phase 7); both are a materially separate project from course/lesson CRUD.
- Parent Portal: a guardian gets portal access via an explicit grant (creates a `Parent`-role user
  linked to the `Guardian` row); the portal is scoped to *only* that guardian's own children
  (enforced per-request, not just by role) and surfaces attendance, homework, exam results,
  announcements, and — since Phase 5 — fees/invoices too. No email/SMS provider is wired up, so
  the generated password is shown once in the admin UI for manual handoff, same gap noted for
  announcements in Phase 3.

## Phase 5 — Finance (done)
- Fee Management: fee categories → fee structures (per class/academic year) → bulk invoice
  generation for a class (one invoice + line items per actively-enrolled student, same
  auto-generate-per-student pattern used throughout this project) → manual payment recording
  against an invoice, with status (unpaid/partial/paid/overdue) computed from running totals, not
  stored as a separate source of truth.
- Payment gateway integrations (Stripe, Flutterwave, M-Pesa, Airtel Money, Mixx by Yas) deferred —
  these need real merchant credentials per provider. What's built instead: payments record *how*
  money came in (method + provider, e.g. "mobile_money" / "M-Pesa") without a live API call, the
  same manual-recording pattern as Phase 3's announcement channels.
- Payroll: staff salary records (basic + allowances + deductions) → a payroll run snapshots every
  staff salary into a payslip when processed (later salary changes don't retroactively alter an
  already-generated payslip) → mark individual payslips paid.
- Expenses: category + amount + date, no gateway involved since this is money leaving, not coming
  in.
- Budgets deferred to Phase 7 (Analytics) — budget-vs-actual is fundamentally a reporting concern
  over the transactional data (invoices, payments, expenses, payroll) this phase built, not another
  transactional table of its own.

## Phase 6 — Facilities & logistics (done)
- Library: books (denormalized `available_copies` counter) → borrow/return loans, capacity checked
  and decremented/incremented transactionally with row locking, same running-total pattern as
  Phase 5's invoice `amount_paid`.
- Hostel: rooms (capacity per room) → allocations, capacity-checked on allocate; allocating a new
  room for a student auto-supersedes their existing active allocation (marks it vacated), the same
  one-active-row-at-a-time pattern as `student_enrollments`.
- Transport: routes (optional capacity) → student assignments, same capacity-check-and-supersede
  pattern as Hostel.
- Inventory: items with a denormalized `quantity` counter → in/out transactions, an append-only
  ledger (no update/delete route) that adjusts quantity transactionally and rejects a stock-out that
  would go negative.
- School Clinic: visit records (reason, diagnosis, treatment, follow-up date) per student — plain
  CRUD, no counters or capacity involved.
- Cafeteria: daily meal menus (date + meal type + description) — plain CRUD, one menu per
  date/meal-type combination.
- Vehicles folded into `transport_routes` rather than a separate table, and `category` kept as a
  plain string on `books`/`inventory_items` rather than a separate categories table — same
  scope-trimming judgment as Phase 4's LMS (courses/lessons only, no quizzes) and Phase 5 (budgets
  deferred). No billing/subscription logic for cafeteria — menus are informational only.

## Phase 7 — Platform maturity (partial — analytics, document generator, public API, a mobile app slice, teacher attendance, budgets, and the report library done)
- Analytics: read-only aggregate reports over data already built by earlier phases (no new
  transactional tables) — enrollment (by class/gender/academic year), attendance (overall rate, by
  class, daily trend), academics (average score by subject, grade distribution, pass rate for a
  selected exam), finance (billed/collected/outstanding, expenses by category, revenue/expense/
  payroll monthly trends). Every query starts from an Eloquent model so `BelongsToSchool`'s tenant
  scope still applies, even where the query needs an explicit join to a reference table for a label.
  Trimmed from the roadmap's "100+ report library" to four report groups covering the modules built
  so far — a literal 100+ reports is a cross-cutting reporting-platform project of its own, not a
  single phase's worth of work.
- Document Generator: PDF generation via `barryvdh/laravel-dompdf` for student certificates
  (enrollment/completion), academic transcripts (aggregated across every exam the student has
  results for), and staff contract letters. Each reuses the domain permission that already gates
  the underlying data (`students.manage` / `exams.manage` / `staff.manage`) rather than a new
  `documents.generate` permission — a generated document is just another view of data that
  permission already controls, the same reasoning `ReportCardController` applies. No QR *image*
  rendering (the `qr_code` value is printed as a text verification code) — actual ID cards with a
  scannable QR stay deferred as originally noted, since that needs a QR image library this phase
  didn't add.
- AI Assistant features (lesson plans, report comments, risk detection, translation) deferred — this
  needs a real LLM API key/credentials, the same gap that deferred payment gateways in Phase 5 and
  SMS/WhatsApp dispatch in Phase 3.
- Public REST API: a versioned `/api/v1/*` surface, mirroring every existing `/api/school/*` route
  (same controllers, both mounted from one shared route closure so the two can't drift apart) but
  authenticated via Sanctum personal access tokens instead of the SPA's session cookie, for
  third-party integrations and future mobile apps. Token issuance is credential-based
  (`POST /api/v1/auth/login` with `email`/`password`/`device_name`) for pure API clients, plus
  self-service key management (`/api/tokens`, session-authenticated) from a new "API Keys" tab in
  Settings for anyone who wants a key without a separate credential exchange. Tokens carry a
  `full-access` or `read-only` scope (Sanctum ability strings); `read-only` tokens are rejected on
  any non-GET/HEAD request. Rate-limited: 10 req/min per IP on login, 120 req/min per user elsewhere.
  This closes a real bug the codebase had explicitly flagged and deferred since Phase 0: naively
  adding `auth:sanctum` middleware calls `Auth::shouldUse('sanctum')`, which flips
  `auth.defaults.guard` for the rest of the request — and Spatie's permission checks resolve their
  guard from that same default, with every permission seeded under `guard_name` `'web'`. The fix
  (`App\Http\Middleware\ResolveTenantFromUser` falls back to `Auth::guard('sanctum')->user()` and
  re-points the request's user resolver, without ever calling `shouldUse()`) means token clients get
  a correctly-scoped, correctly-permissioned `$request->user()` everywhere, and the SPA's session
  auth is completely untouched. One more layer to that fix: Spatie's `role:X` route middleware
  doesn't consult `$request->user()` at all — it calls `Auth::guard('web')->user()` directly, which
  has no idea a resolver was set on the request. Fixed by also calling
  `Auth::guard('web')->setUser($user)` in the same middleware — that only sets the guard's in-memory
  user for this request (no session write, no default-guard change), found and fixed while building
  the mobile app below (its Parent-role screens are gated by `role:Parent`).
- React Native mobile app: built as a Parent-role vertical slice (Expo + TypeScript, in `mobile/`)
  proving the public API against a real non-browser-shaped client — login, announcements, and
  per-child attendance/homework/exam results, all against `/api/v1/*` with a Sanctum personal
  access token (obtained via `POST /api/v1/auth/login`, stored in `expo-secure-store` natively or
  `localStorage` on Expo web, since SecureStore has no web implementation). Deliberately not full
  feature parity across all four roles named in the original roadmap line (student, parent, teacher,
  admin) — that's the entire web SPA's surface re-built a second time on a different framework, not
  a single pass's worth of work. Parent was picked because `ParentPortalController` already existed
  end-to-end from Phase 4 and is the most natural "read my own child's data on a phone" use case.
  Verified via Expo's web target (a real browser, screenshotted with Playwright) rather than an
  iOS/Android simulator, since none is available in this environment; the same code renders on
  native via `react-native-web`'s counterpart primitives, but on-device testing is still outstanding.
- Teacher attendance: `staff_attendance_records` (one row per staff member per day, unique on
  `user_id`+`date`), a `register()`/`mark()` pair mirroring the student-attendance pattern from
  Phase 3 exactly (roster all active staff, `updateOrCreate` on save) rather than a bespoke design.
  Deferred out of Phase 2/3 originally because Employee Management hadn't been built yet at that
  point in the sequencing; closed here alongside its natural analytics counterpart below.
- Budgets: the `budgets` table deferred from Phase 5 (one row per expense-category/academic-year
  pair) plus an `analytics/budget` endpoint computing actual spend as an all-time sum per category
  (not date-range-scoped to the academic year — the demo school's academic year starts after
  "today", so date-scoping would zero out every actual; this matches how `expenses_by_category`
  already worked on the main Finance report) and flagging each line over/near/under budget.
- Report Library: a second, complementary reporting surface alongside the Analytics dashboards —
  14 flat, exportable tables (`ReportController::CATALOG`) across Academic/Attendance/Finance/HR/
  Facilities, each gated by the same domain permission as its underlying module, with a CSV export
  button per report. Still deliberately not a literal "100+ reports" for the same reason Analytics
  was trimmed above; a curated catalog beats an arbitrary count. Building this surfaced two bugs
  fixed along the way: the exam-results report was picking the *most recent* exam by date, which
  could easily be a mostly-empty one, so it was switched to the same "richest dataset" (most results
  recorded) selection already used in `AnalyticsController::academics()`; the payroll report was
  using a raw `DB::table('payroll_runs')` query, which bypasses `BelongsToSchool`'s Eloquent global
  scope entirely — a genuine cross-tenant-leakage risk, not just a wrong-default bug — fixed by
  replacing it with an Eloquent `Payslip::query()` aggregate.
- Medical records: turned out to already exist — the nav's "Medical" entry (under Students) and
  the Facilities section's "Clinic" entry both described the same `clinic_visits` data (reason/
  diagnosis/treatment/follow-up per student). Rather than build a second, competing model, the
  "Medical" nav entry was removed and its slot is just "Clinic" now — one feature, one name, no
  duplicate links to the same page.
- Discipline: `discipline_incidents` (category, severity, description, action taken, status) per
  student, CRUD gated behind a new `discipline.manage` permission — given to School Owner/
  Principal/Vice Principal plus the roles who'd actually witness and log incidents day to day
  (Teacher, Class Teacher, Security Officer), unlike most `*.manage` permissions which stay with
  admin-tier roles only.
- Graduation: closes the "leaver & transfer records" gap in the `students.status` enum
  (`active/graduated/transferred/withdrawn`) that already existed since Phase 2 but had no audit
  trail or batch workflow behind it. A new append-only `student_status_changes` table is written
  automatically from `Student::booted()`'s `updated()` hook whenever `status` changes — regardless
  of whether the change came from a single student edit or the new `graduation/batch` endpoint —
  so the history can never drift out of sync with the student record itself, the same
  write-once-read-from-one-place reasoning the Report Library bug fixes above depend on.
  `GraduationController::batch()` also flips the student's active `student_enrollments` row to
  match, preserving the "one active enrollment at a time" invariant Phase 2 established.
- Messages: one-to-one direct messaging (`conversations` + `messages` tables) alongside the
  existing one-to-many Announcements, deliberately with no gating permission of its own — any
  authenticated staff member can message any other, same "no permission needed beyond being
  logged in" reasoning leave-request self-service creation already uses. `Conversation::between()`
  canonicalizes the user-id pair (smaller UUID first) before insert so the unique constraint alone
  prevents duplicate threads regardless of who messages first. No websockets — the frontend polls
  (conversation list every 20s, an open thread every 8s), a deliberately simple choice consistent
  with this phase's "no real-time infrastructure" scope everywhere else (Analytics, Report Library).
- Ranked report cards + bulk PDF generation: closes the gap where marks could be recorded and
  graded but a class had no way to see who came first, who led a given subject, or hand out an
  actual printable report card. `ExamService::classRanking()`/`subjectRanking()` compute "standard
  competition ranking" (ties share a position; the next distinct score skips ahead by the number
  tied, e.g. 1, 2, 2, 4) — class rank by the average of each student's per-subject percentages
  (only counting subjects actually graded, so an ungraded subject can't drag anyone's average down),
  matching the same "average of percentages" convention `AnalyticsController::academics()` already
  established for by-subject stats; subject rank by raw marks, since every row in one exam_subject
  already shares the same max_marks. `ReportCardController` exposes this three ways: the existing
  single-student JSON view (now annotated with class/subject rank), a `GET .../report-cards/ranking`
  endpoint that doubles as both the on-screen leaderboard and the "pick one student" list on the
  frontend, and PDF generation via `documents/report-card.blade.php` — one endpoint for a single
  student, one for every graded student in a class at once (the "Generate all" checkbox on
  ExamDetailPage's Report Cards card routes to whichever endpoint matches; unchecked always means
  exactly one student, checked always means the whole class, never a partial selection).
  Bulk generation deliberately produces one combined multi-page PDF (page-break per student) rather
  than a ZIP of separate files — matches how a school actually uses it ("print the whole class"),
  and needed no new PHP dependency `barryvdh/laravel-dompdf` didn't already provide.
  This also surfaced a permission gap worth closing: `exams.manage` had covered both
  administering an exam (creating it, adding class/subject combinations, setting pass/max marks)
  and recording marks — meaning a plain subject Teacher could change a subject's pass mark, which
  contradicts how the school actually wants this to work ("tests are set by the academic teacher;
  subject teachers just record the marks"). Split into `exams.manage` (exam administration + report
  card generation — School Owner/Principal/Vice Principal/Academic Master/Class Teacher, the last
  because printing report cards for one's own homeroom class is a normal part of that role) and a
  new `exam-marks.record` (gradebook entry only — the same five roles plus plain Teacher). The
  letter grade itself was already fully server-computed from the school's default `GradingSystem`
  bands ("A is 80-100", set via `subjects.manage`, a separate permission again since it's a
  school-wide policy decision, not a per-exam one) — `RecordExamMarksRequest` never accepted a
  `grade` field from the client, so a subject teacher was already unable to set their own grade;
  only the pass-mark/exam-structure gap needed fixing.
- Remarks, class/teacher performance, the public Notice Board, and parent-facing performance
  messages: five additions on top of the ranking work above, all reusing `ExamService::classRanking()`
  rather than inventing parallel queries.
  - `GradeBand.remark` (e.g. "Excellent", "Fail") already existed in the schema and
    `GradingSystemRequest` already accepted it, but the frontend form never exposed it — a school
    could never actually set it. Added the missing input; it's now the primary signal
    `PerformanceMessageService` uses to pick a message's tone, falling back to raw percentage
    thresholds only when a school leaves it blank.
  - `PerformanceMessageService` turns a percentage (+ that remark, + class rank) into a warm,
    parent-facing message with a tier (excellent/good/average/needs_improvement/fail), an emoji, and
    two or three sentences — reused identically on report cards, the Parent Portal, and the Parent
    Dashboard so the tone never diverges depending on where a guardian is looking. "Excellent" reads
    as a celebration; "needs_improvement" is the "pull up your socks" case, phrased as a
    parent-and-school team-up rather than a scolding.
  - `report_card_remarks` is new: a class teacher's own free-text comment per (exam, student),
    separate from the auto-generated message above since one is a human's personal note and the
    other is always computed fresh from the marks — conflating them would mean losing the human note
    every time marks are re-entered.
  - `ExamService::classSummary()` and `teacherPerformance()` answer "how did the class do" and
    "which teacher's students did best" for one exam. The class summary reuses `classRanking()`'s own
    numbers (no separate aggregate query to drift out of sync) plus a pass-rate query scoped to
    subjects that actually have a `pass_marks` set. Teacher performance is the more interesting one:
    `exam_subjects` only records a class+subject combination, never who taught it, so the teacher is
    inferred from that class+subject's `TimetableEntry` for the same academic year — the only place
    that link exists at all. An exam_subject with no matching timetable entry is simply excluded from
    the leaderboard rather than attributed to "Unassigned".
  - The public Notice Board (`NoticeBoardController`, `routes/api.php`'s `public/schools/{slug}`
    group) is the digital version of a school pinning the full ranked results sheet to a physical
    board — genuinely unauthenticated, matching how that already works on paper in this market (unlike
    a Western-style "only you can see your own marks" default). Gated on two things: the school must
    be `approved`, and the exam must be explicitly `published` — a new fourth exam status
    (`ExamController::updateStatus`) that existed in the schema/validation rules since Phase 4 but had
    no UI or enforcement anywhere until now. Reaching it took one real bug fix along the way: `{exam}`
    and `{schoolClass}` in these routes can't be Eloquent route-model-bound the normal way, because
    binding happens before the controller body runs — with no tenant set yet (there's no logged-in
    user for `ResolveTenantFromUser` to read a school_id from), `BelongsToSchool`'s "no tenant = deny
    by default" scope would 404 the lookup every time before the school is even resolved from its
    slug. Fixed by taking `{exam}`/`{schoolClass}` as plain route strings and resolving them manually
    inside each method, after `Tenant::set()` has run.
  - The Parent Portal's `results()` endpoint gained the same rank + performance message, and is now
    gated to `completed`/`published` exams only (previously showed marks from an exam still mid-
    grading). `published` additionally means the same exam is also live on the public Notice Board;
    `completed` alone is enough for the Parent Portal, since that's already an authenticated,
    ownership-checked channel — publishing to the Notice Board is a separate, more public decision a
    school makes deliberately.

## Automated test suite (started)

Every module above was built and manually curl/browser-verified as it shipped, but until now none
of that verification was captured as an automated test — the "tests" step the master spec lists for
every module had been skipped every single time. First real coverage, prioritized by risk rather
than by module, since exhaustive coverage of 29 modules in one pass isn't realistic:

- **Backend** (`backend/tests`, PHPUnit, SQLite in-memory): `TenantIsolationTest` — the single most
  important property of the whole app (a school can never see another school's data over any
  endpoint; MySQL has no RLS backstop, see `BelongsToSchool`); `ExamPermissionSplitTest` — guards
  this session's `exams.manage`/`exam-marks.record` split so a future change can't silently
  re-broaden what a plain Teacher can touch; `ExamRankingTest` — competition-ranking tie-breaking
  (1, 2, 2, 4) and grade-band resolution; `ReportCardTest` — rank/grade/performance-message/manual-
  remark correctness end to end, plus both PDF endpoints; `NoticeBoardTest` — the newest and most
  exposed surface (fully public, no auth), covering published-only visibility, cross-school
  isolation, and a suspended school being unreachable; `PerformanceMessageServiceTest` — pure unit
  coverage of every tier and the remark-overrides-percentage priority rule. A shared fixture trait
  (`tests/Concerns/SetsUpTenant.php`) builds a fully wired school (class, subject, grading system,
  students) in a few lines so each test file stays focused on what it's actually checking.
  Writing `ExamRankingTest` caught a real, pre-existing bug immediately: every `avg(marks_obtained /
  max_marks * 100)` raw-SQL query (in `AnalyticsController` and `ExamService`, some dating back to
  the Phase 7 Analytics work) relied on MySQL's `/` always doing true division — correct in
  production, but SQLite (chosen for tests specifically because it needs no running database server)
  does integer division when both operands look like integers, silently truncating every percentage
  to 0. Fixed by forcing float division (`* 1.0`) everywhere the pattern appears, which changes
  nothing in production but makes the SQL portable and — more importantly — means the test suite
  itself is now trustworthy instead of quietly exercising a code path that only worked by accident
  under one specific database engine.
- **Frontend** (`frontend/src/**/*.test.ts`, Vitest, no jsdom — plain Node is enough since every
  test here is pure logic, not component rendering): `hasPermission()`'s array ("any of") behavior,
  `escapeCsvCell()`'s quoting rules, and `rankByMarks()` — the Gradebook's client-side mirror of the
  backend's competition-ranking rule, pulled out of `GradebookPage.tsx` into `lib/ranking.ts` so it
  could be tested without importing a whole page component.

Deliberately not attempted yet: Discipline/Graduation/Messages/Budgets/Report-Library CRUD smoke
tests, and any frontend component/rendering tests (would need jsdom + Testing Library, a heavier
addition than this pass's scope). The foundation (fixture trait, Vitest config, both `npm test` /
`php artisan test` commands) is in place for either to be added incrementally without more setup
work.

## Bulk student CSV import

Closes the second gap from the same "make this competitive" pass: onboarding a new school meant
typing every student in one at a time via `StudentController`. `StudentImportService` reads a CSV
(`admission_number`/`first_name`/`last_name` required, `date_of_birth`/`gender`/`class_name`
optional — `class_name` resolves case-insensitively to a `SchoolClass` and, if matched, also creates
an active enrollment in whatever academic year is current), one row at a time, completely
independently — a bad row (missing name, duplicate admission number, either within the file or
already in the school) never blocks the rest of the file from importing.

Preview and commit deliberately share one code path (`process($file, $commit)`) rather than two:
`$commit = false` builds and validates every row exactly the same way a real import would, just
stopping before the `Student::create()` call, so the frontend's "Preview" screen can never show
something different from what actually happens on "Confirm import". The two-step UI
(`StudentsPage.tsx`'s `ImportStudentsDialog`) uploads the same file twice — once to preview, once to
commit — rather than caching parsed rows server-side between requests, keeping the endpoint
stateless.

Writing `StudentImportTest.php` caught a real bug before it ever reached a real CSV: an optional
column absent from a given file (e.g. a file with no `class_name` column at all) crashed the request
with "Undefined array key", because `$data['date_of_birth'] ?: null` still triggers that warning for
a genuinely-missing key — `?:` only guards against falsy *values*, not absent ones. Manual curl
testing hadn't caught this because every test file used while curl-verifying happened to include all
optional columns. Fixed by checking with `empty()` first, which is null-safe for a missing key the
same way `??` is, but (unlike `??`) also normalizes a present-but-blank cell to `null` — the actual
intent here, and the same behavior `?:` was originally reaching for.

## Audit trail

Closes the third gap from the same pass: nothing recorded who changed a fee, a grade, or an expense
after the fact — the kind of question that comes up the moment a parent or a teacher disputes a
number. `LogsActivity` (`app/Models/Concerns`) is an opt-in trait, not a global one: applied to
`Invoice`, `Payment`, `Expense`, `Payslip`, `Budget`, and `ExamResult` — the models where "who changed
this" actually matters for a dispute — rather than all 40+ models in the app, since logging every
CRUD action everywhere (re-ordering a cafeteria menu, editing a timetable period) would just bury the
few changes anyone would ever need to look up. Each logged model can override `activityDescription()`
for a human-readable line ("Invoice INV-2026-0043 updated (total 150000, status paid)") and
`logsActivityOn()` to narrow which lifecycle events actually count — `ExamResult` is the case that
needed it: a stub row (null marks) is created for every actively-enrolled student the instant a
subject is added to an exam, before anyone has graded anything, so only its later `updated` event
(marks actually entered) is audit-worthy; logging `created` too would mean one "add subject" click
generating dozens of meaningless log rows. Every description deliberately reads only scalar
attributes already on the model, never a relation — `ExamResult` (bulk gradebook save) and `Payslip`
(bulk payroll processing) are both written many-at-once in a loop, and touching a relation in the
description would turn one N-row save into an N+1 query storm.

`ActivityLogController` (`GET /school/activity-logs`, filterable by subject type and action) is
gated by a new `audit-log.view` permission restricted to the top admin tier only (School Owner/
Principal/Vice Principal) — deliberately not extended to Academic Master/Accountant/Bursar the way
`analytics.view` was, since this log spans both finance and grades and reads as a whole-school
oversight tool, not a per-department one. `Auth::id()` (not `$request->user()->id` — a model event
has no `$request`) resolves correctly for both session and token clients for the same reason
documented on `ResolveTenantFromUser`: the default guard never gets flipped away from `'web'`.

## Multi-branch reporting

The fourth and largest item from the "make this competitive" pass — large enough that it started
with a scoping conversation rather than a plan, once it became clear `branch_id` existed on exactly
one table (`rooms`) before this work began. A school with two campuses genuinely could not assign a
student, a class, or a staff member to either one.

The schema change turned out smaller than the feature: only `school_classes` and `staff_profiles`
gained a `branch_id` column. Everything else derives its branch transitively through whichever of
those two it's already linked to — a student's branch is `currentEnrollment.schoolClass.branch`, an
admission application's is `applyingForClass.branch`, attendance/exam/timetable data all reach branch
through the `school_class_id` they already carry — rather than duplicating the column onto every
table that's ever branch-relevant. Same "derive, don't duplicate" reasoning already used for a
student's current class (via enrollment) and, this session, a student's current branch (via that same
enrollment's class). Both new columns are nullable: a single-campus school (the common case) is never
forced to assign one.

`AnalyticsController::byBranch()` is the actual reporting deliverable — a side-by-side comparison
table (student count, staff count, 30-day attendance rate, all-time academic average) across every
branch, one query per metric rather than one giant join, merged by branch id. Academic average is
deliberately all-time rather than year-scoped, the same fix already applied to budget-vs-actual and
Report Library exam-results, for the same reason: this school's academic year starts in the future
relative to "today" in the seeded demo data, and year-scoping would zero out every branch's average.

`branch_id` filters were added to the four endpoints that needed them (Students, Staff, Classes,
Admissions) rather than globally — Discipline/Graduation/Messages/Budgets and the rest don't have a
branch-meaningful dimension to filter by. On the frontend, since `SimpleCrudCard` (the shared
create/delete component used elsewhere) has no edit capability, assigning a branch to an *existing*
class or staff member needed a different pattern: a small inline `<Select>` per table row that calls
the same `useUpdate()` mutation `createCrudHooks` already exposed but no page had wired into a UI yet.

## Teacher mobile app (second vertical slice)

`mobile/` was Parent-only until now (login, announcements, per-child attendance/homework/exam
results). This adds a Teacher slice — deliberately just the two actions worth doing from a phone in
a classroom rather than a full second copy of the web app's teacher-facing surface: **Attendance**
(mark today's register for a class) and **Gradebook** (record marks for an exam subject). Both reuse
the exact same `/api/v1/school/*` endpoints the web app's `AttendancePage`/`GradebookPage` already
call — no new backend work, since the versioned public API (Phase 7) already mirrors every
`/api/school/*` route for exactly this kind of client.

The two new tabs are gated by the same permissions the web app gates the same actions behind
(`attendance.manage`, `exam-marks.record` — this session's own permission split) rather than by role
name, so a teacher's phone can do exactly what their web login can, no more and no less; a Principal
or Class Teacher gets both tabs too, a plain Accountant gets neither. No new native dependency was
added for either screen — class/exam/subject pickers are a horizontally-scrolling row of pressable
chips (matching the app's existing zero-extra-dependency posture) rather than reaching for a picker
library, and the date field on Attendance is a plain `YYYY-MM-DD` text input rather than
`@react-native-community/datetimepicker`, since adding a native module is a materially bigger
decision than adding a JS dependency (it touches the native build, not just the bundle).

`resolveCurrentAcademicYearId()` mirrors the same "is_current, else most recent by start_date"
fallback used server-side throughout this session (budget-vs-actual, the branch comparison report) —
the seeded demo academic year has `is_current: false` for the same reason those needed the fallback,
so the mobile app would otherwise have no way to silently pick the right year without asking a
teacher to select one on every screen.

Verified the same way the original Parent slice was, since no iOS/Android simulator or Playwright is
available in this environment: a clean TypeScript compile, a successful Metro/Expo-web bundle build
(confirmed by fetching the compiled JS and finding the new screens' UI strings in it — proof the
bundler actually included them, not just that the files parse), and every endpoint the new screens
call hand-verified via curl using a real seeded Teacher login (`peter@stjosephs.test`, whose seeded
password didn't work — reset directly via `Tenant::runAsPlatform()` in Tinker, the same escape hatch
`ResolveTenantFromUser` itself uses, since a raw `User::where(...)` outside a request has no tenant
context and would otherwise match nothing). On-device testing remains outstanding, as it was for the
Parent slice.

## Offline resilience (web frontend — read caching, not offline-first)

Scoped deliberately to the read-only half of "offline resilience" after a decision point: a full
offline-first build (queue mutations made with zero connectivity, sync and resolve conflicts when
back online) is a materially bigger and riskier undertaking for a school ERP specifically — two
teachers editing the same student's attendance offline, then syncing in conflicting order, is a real
way to silently corrupt real records. What's built instead: the app shell loads with zero
connectivity, previously-loaded data stays visible while offline, and a new *mutation* attempted
while offline fails clearly rather than silently or confusingly. No offline data entry, no sync
queue, no conflict resolution — those stay explicitly out of scope, not a gap discovered later.

- **PWA shell** (`vite-plugin-pwa`, `vite.config.ts`): precaches only static assets (JS/CSS/HTML/
  fonts/icons) via Workbox, `registerType: 'autoUpdate'` so a redeploy updates the service worker
  automatically rather than pinning users to a stale build indefinitely. Deliberately does **not**
  cache API responses at the service-worker level — that's a second, harder-to-invalidate copy of
  the same data with none of the safety the query-cache approach below has (see next point).
- **Query cache persistence** (`@tanstack/react-query-persist-client` + `query-sync-storage-persister`,
  `main.tsx`): the existing React Query cache is persisted to `localStorage` (24h max age, a
  `buster` string to invalidate on any incompatible shape change) and rehydrated on load, so a
  dashboard/student-list/etc. a user already viewed stays visible when they go offline — `networkMode:
  'offlineFirst'` on queries means cached data renders immediately rather than blocking on a network
  round-trip. Mutations deliberately keep the default `'online'` network mode — a save attempted
  offline fails visibly rather than queuing, matching the "no mutation queue" scope decision above.
  Persisting real school data (grades, fees, student records) to `localStorage` means it outlives the
  tab — `useLogout()` now does a full `queryClient.clear()` and removes the persisted key directly,
  so a shared/public device doesn't hand the next person who logs in the previous user's cached data.
- **Offline banner** (`useOnlineStatus`, `OfflineBanner`, mounted once in `App.tsx` above the router
  so it covers every layout including login): a plain `navigator.onLine` + `online`/`offline` event
  listener. Turns "why won't this save?" into an explicit, expected state instead of a silent or
  confusing failure.
- **Clearer mutation error messages** (`apiClient` response interceptor, `api/client.ts`): every
  mutation handler across the app already follows the same
  `error.response?.data?.message ?? '<local fallback>'` pattern — dozens of call sites, each with its
  own generic fallback text ("Could not create student", "Something went wrong"). A true network
  error never gets a response at all, so every one of those call sites was already silently falling
  through to a fallback that reads like a validation failure, not "you're offline." One interceptor
  that attaches a synthetic response only when `error.response` is genuinely absent (never overwriting
  a real server error) fixes the message everywhere at once, instead of touching 40+ files individually.

## AI Assistant (chat + lesson-plan generator, gated behind a provider API key)

The last "Coming soon" placeholder in the nav. Built as a real integration with Anthropic's Claude
API, not a mock — but since no LLM provider key exists in any environment by default, the whole
feature has to degrade cleanly rather than error when unconfigured, the same shape as the
payment-gateway/SMS gaps: infrastructure fully built, functionality unlocked the moment a school's
platform admin adds `ANTHROPIC_API_KEY` to `.env`.

- **`AiAssistantService`** (`app/Services/School/AiAssistantService.php`): a thin, stateless wrapper
  around the Anthropic Messages API. Nothing is persisted server-side — every chat request carries
  its own full message history from the frontend, so there's no new data-retention surface to reason
  about. `isConfigured()` just checks whether the key is present; both the controller and the
  frontend branch on it explicitly instead of letting a missing key surface as an unhandled 500.
- **Grounding, deliberately thin**: the system prompt gives the model the school's name and the
  asking user's name/role — nothing else. It is never handed raw student records, grades, or
  financial figures to reason over, and is explicitly instructed not to invent numbers it wasn't
  given. That's what makes sharing one API key safely across every tenant on the platform fine: there
  is no per-school data in the prompt for a cross-tenant leak to even be about.
- **Two capabilities, one endpoint each**: `chat` (freeform Q&A, capped at 20 turns/4000 chars per
  turn since every request re-sends the whole history to a paid API) and `lesson-plan` (structured
  input — subject, class, topic, duration, optional notes — resolved via tenant-scoped Eloquent
  lookups, not trusted from the request body). The lesson-plan prompt demands a single JSON object
  back; Claude sometimes wraps that in a ` ```json ` fence anyway, so `stripCodeFences()` strips it
  before parsing — covered by a test that deliberately fences the mocked response to make sure that
  code path actually runs.
- **Rate-limited separately from general API traffic** (`AppServiceProvider`, `throttle:ai-assistant`,
  15/min per user): this hits a paid external API per call, unlike the rest of the app's own database
  — a runaway frontend loop or retry storm has a real cost ceiling other endpoints don't.
- **New permission `ai-assistant.use`** (`Phase8PermissionsSeeder`): granted broadly across every
  staff-facing role, not scoped to one department the way `finance.manage`/`exams.manage` are — it's
  a general productivity tool. Deliberately excluded from Student/Parent, who have their own portals
  outside the `/app` module grid this sits in.
- **Testing without a real key**: `AiAssistantTest` uses Laravel's `Http::fake()` to stand in for the
  Anthropic API in every "configured" test, so the suite never makes a real network call or needs a
  real key — it covers the not-configured 503, the permission gate, validation, a faked success reply,
  a faked provider failure (502), and a faked lesson plan (including the code-fence-stripping case),
  plus a tenant-isolation check (a subject id from another school 404s via the same `findOrFail`
  pattern every other tenant-scoped controller uses, regardless of what the request's own `exists`
  rule already allowed through).
- **Frontend** (`AiAssistantPage.tsx`): a status check drives which of three states renders — loading
  skeleton, a plain-language "not configured, ask your admin" notice, or the real chat/lesson-plan
  tabs. Chat history lives in component state only (never persisted), mirroring the backend's
  stateless design. The lesson-plan panel resolves subject/class names from the same `useSubjects`/
  `useClasses` hooks already used elsewhere, so there's no new dropdown-data plumbing.

Each module, when built, follows the standard from the master spec: migrations → models/relationships
→ seeders/factories → Form Requests → policies → service classes → API controllers/resources →
tests → React pages/components → wired to backend.
