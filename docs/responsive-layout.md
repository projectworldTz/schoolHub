# Responsive layout update

The shared platform, school, and parent layouts now adapt to narrow screens with compact branding, wrapping controls, and reduced side padding. The platform menu switches to its drawer below the desktop breakpoint.

Shared cards and grid children can shrink without forcing page overflow. Wide tables scroll inside their own containers. Tabs scroll horizontally, forms collapse to one column on phones, and page/card action groups wrap. Dialogs and drawers are constrained to the viewport and scroll internally on short screens. Touch buttons and tabs have a minimum 44px height, mobile form fields use 16px text, and the floating Quick Add button respects the device bottom safe area.

Verification on the running local app used headless Chromium with the existing Super Admin login and school impersonation. No forms were submitted or school records changed during browser checks.

- 19 routes checked at 320px: dashboard, finance, students, staff, settings, analytics, timetable, exams, attendance, admissions, payroll, expenses, library, hostel, inventory, communication, messages, AI Assistant, and platform schools.
- Finance, students, and platform schools also checked at 390, 768, 1024, and 1440px.
- No page-level horizontal overflow remained in these checks. Wide tables and tabs intentionally keep local horizontal scrolling.
- Student dialog fit within a 320px viewport; the mobile navigation drawer fit within 390px.
- Touch emulation confirmed 44px tab targets. The school registration dialog fit within 320 x 480px and scrolled internally to expose the full form.
- Frontend tests: 28 passed. Lint: no errors, six existing Fast Refresh warnings. Production build and TypeScript checks passed (existing large-bundle warning).

These checks cover representative routes and shared components, not every possible data state or physical device. Public website pages retain their existing responsive layouts and receive the shared component improvements; a published school website and real parent account were not separately exercised.
