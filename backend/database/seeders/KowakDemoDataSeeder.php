<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\Announcement;
use App\Models\Book;
use App\Models\Branch;
use App\Models\CafeteriaMenu;
use App\Models\ClinicVisit;
use App\Models\Conversation;
use App\Models\Course;
use App\Models\Department;
use App\Models\DisciplineIncident;
use App\Models\Exam;
use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Guardian;
use App\Models\Holiday;
use App\Models\HostelRoom;
use App\Models\InventoryItem;
use App\Models\LeaveRequest;
use App\Models\Lesson;
use App\Models\Message;
use App\Models\PayrollRun;
use App\Models\ReportCardRemark;
use App\Models\Room;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\StaffContract;
use App\Models\StaffProfile;
use App\Models\StaffSalary;
use App\Models\Stream;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\GradingSystem;
use App\Models\Term;
use App\Models\TimetableEntry;
use App\Models\TimetablePeriod;
use App\Models\TransportRoute;
use App\Models\User;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PayrollService;
use App\Services\School\AttendanceService;
use App\Services\School\ExamService;
use App\Services\School\HomeworkService;
use App\Services\School\HostelService;
use App\Services\School\InventoryService;
use App\Services\School\LibraryService;
use App\Services\School\StaffAttendanceService;
use App\Services\School\TransportService;
use App\Support\Tenancy\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * One-off demo dataset for a single already-registered school, so its owner
 * can click through every module with realistic data instead of an empty
 * dashboard. Deliberately hand-rolled (no Faker: fakerphp/faker is
 * require-dev only, and production runs `composer install --no-dev`).
 *
 * Every staff/demo login shares DEMO_PASSWORD — this is throwaway test
 * data for one specific school, not a security-sensitive seeding path.
 *
 * Guarded against double-running: aborts if this school already has
 * students, since re-running would collide with unique constraints
 * (admission numbers, invoice numbers, etc.) rather than layering on more
 * demo data.
 */
class KowakDemoDataSeeder extends Seeder
{
    protected const SCHOOL_NAME_CONTAINS = 'KOWAK';

    protected const DEMO_PASSWORD = 'Kowak@Demo2026';

    protected School $school;

    protected AcademicYear $academicYear;

    protected Term $term1;

    protected Term $term2;

    /** @var array<string, SchoolClass> */
    protected array $classes = [];

    /** @var array<string, Stream> */
    protected array $streams = [];

    /** @var array<string, Subject> */
    protected array $subjects = [];

    /** @var array<string, User> */
    protected array $staff = [];

    /** @var array<int, Student> */
    protected array $students = [];

    protected Branch $mainBranch;

    public function run(): void
    {
        $this->school = School::where('name', 'like', '%'.self::SCHOOL_NAME_CONTAINS.'%')->first();

        if (! $this->school) {
            $names = School::pluck('name')->implode(', ');
            $this->command->error(
                'No school found matching "'.self::SCHOOL_NAME_CONTAINS.'". Schools on file: '.$names
            );

            return;
        }

        // Every query below — including the idempotency guard right after
        // this — goes through BelongsToSchool's global scope. Without an
        // active tenant, that scope defaults to "only school_id IS NULL"
        // rows, which would silently AND itself against an explicit
        // ->where('school_id', ...) and never match anything. Setting this
        // before the guard (not just before the seeding transaction) is
        // what makes the guard actually see existing data. It's also what
        // every service below (ExamService, InvoiceService, etc.) needs —
        // they're written for real HTTP requests, where
        // App\Http\Middleware\ResolveTenantFromUser has already called
        // Tenant::set(), and several create tenant-scoped rows (ExamResult,
        // Invoice, Payslip, ...) without passing school_id explicitly,
        // relying on BelongsToSchool's creating() hook to fill it in from
        // the active tenant.
        Tenant::set($this->school->id);

        if (Student::where('school_id', $this->school->id)->exists()) {
            $this->command->warn("Demo data already exists for {$this->school->name} — skipping to avoid duplicates.");

            return;
        }

        $this->command->info("Seeding demo data for {$this->school->name} ({$this->school->id})");

        DB::transaction(function () {
            $this->seedStructure();
            $this->seedStaff();
            $this->seedStudentsAndGuardians();
            $this->seedAdmissions();
            $this->seedTimetable();
            $this->seedAttendance();
            $this->seedHomework();
            $this->seedExams();
            $this->seedAnnouncementsAndMessaging();
            $this->seedLeaveAndStaffAttendance();
            $this->seedFinance();
            $this->seedFacilities();
            $this->seedDiscipline();
            $this->seedLms();
        });

        $this->command->info('Done. Every demo staff login password is: '.self::DEMO_PASSWORD);
    }

    protected function seedStructure(): void
    {
        $this->mainBranch = Branch::create([
            'school_id' => $this->school->id,
            'name' => 'Main Campus',
            'city' => $this->school->city ?? 'Musoma',
            'is_main' => true,
        ]);

        $this->academicYear = AcademicYear::create([
            'school_id' => $this->school->id,
            'name' => '2026',
            'start_date' => '2026-01-06',
            'end_date' => '2026-11-27',
            'is_current' => true,
        ]);

        $this->term1 = Term::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Term 1',
            'start_date' => '2026-01-06',
            'end_date' => '2026-05-01',
            'is_current' => false,
        ]);

        $this->term2 = Term::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Term 2',
            'start_date' => '2026-05-25',
            'end_date' => '2026-11-27',
            'is_current' => true,
        ]);

        Holiday::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Mid-Term Break',
            'start_date' => '2026-05-02',
            'end_date' => '2026-05-24',
            'description' => 'Break between Term 1 and Term 2',
        ]);

        $departments = [
            'Sciences' => 'SCI',
            'Mathematics' => 'MATH',
            'Languages' => 'LANG',
            'Humanities' => 'HUM',
        ];
        $departmentModels = [];
        foreach ($departments as $name => $code) {
            $departmentModels[$name] = Department::create([
                'school_id' => $this->school->id,
                'name' => $name,
                'code' => $code,
            ]);
        }

        $gradingSystem = GradingSystem::create([
            'school_id' => $this->school->id,
            'name' => 'NECTA O-Level Scale',
            'is_default' => true,
        ]);
        $gradingSystem->gradeBands()->createMany([
            ['label' => 'A', 'min_score' => 75, 'max_score' => 100, 'remark' => 'Excellent', 'gpa' => 1.0],
            ['label' => 'B', 'min_score' => 65, 'max_score' => 74, 'remark' => 'Very Good', 'gpa' => 2.0],
            ['label' => 'C', 'min_score' => 50, 'max_score' => 64, 'remark' => 'Good', 'gpa' => 3.0],
            ['label' => 'D', 'min_score' => 30, 'max_score' => 49, 'remark' => 'Satisfactory', 'gpa' => 4.0],
            ['label' => 'F', 'min_score' => 0, 'max_score' => 29, 'remark' => 'Fail', 'gpa' => 5.0],
        ]);

        $subjectDefs = [
            'English Language' => 'ENG', 'Kiswahili' => 'KISW', 'Basic Mathematics' => 'MATH',
            'Biology' => 'BIO', 'Chemistry' => 'CHEM', 'Physics' => 'PHY',
            'Geography' => 'GEO', 'History' => 'HIST', 'Civics' => 'CIV', 'Commerce' => 'COM',
        ];
        $subjectDept = [
            'English Language' => 'Languages', 'Kiswahili' => 'Languages', 'Basic Mathematics' => 'Mathematics',
            'Biology' => 'Sciences', 'Chemistry' => 'Sciences', 'Physics' => 'Sciences',
            'Geography' => 'Humanities', 'History' => 'Humanities', 'Civics' => 'Humanities', 'Commerce' => 'Mathematics',
        ];
        foreach ($subjectDefs as $name => $code) {
            $this->subjects[$name] = Subject::create([
                'school_id' => $this->school->id,
                'department_id' => $departmentModels[$subjectDept[$name]]->id,
                'name' => $name,
                'code' => $code,
            ]);
        }

        $rooms = [];
        foreach (['1', '2', '3', '4', 'Lab A', 'Lab B'] as $roomName) {
            $rooms[$roomName] = Room::create([
                'school_id' => $this->school->id,
                'branch_id' => $this->mainBranch->id,
                'name' => 'Room '.$roomName,
                'capacity' => 45,
                'type' => str_starts_with($roomName, 'Lab') ? 'lab' : 'classroom',
            ]);
        }

        foreach ([1, 2, 3, 4] as $level) {
            $class = SchoolClass::create([
                'school_id' => $this->school->id,
                'branch_id' => $this->mainBranch->id,
                'name' => "Form {$level}",
                'level' => $level,
            ]);
            $this->classes["Form {$level}"] = $class;

            $class->subjects()->attach(collect($this->subjects)->pluck('id'));

            $this->streams["Form {$level}"] = Stream::create([
                'school_id' => $this->school->id,
                'school_class_id' => $class->id,
                'academic_year_id' => $this->academicYear->id,
                'name' => 'A',
                'capacity' => 45,
                'room_id' => $rooms[(string) $level]->id,
            ]);
        }
    }

    protected function seedStaff(): void
    {
        $roster = [
            ['name' => 'Grace Mushi', 'role' => 'Principal', 'title' => 'Principal'],
            ['name' => 'Joseph Kway', 'role' => 'Second Master', 'title' => 'Second Master'],
            ['name' => 'Agnes Mrema', 'role' => 'Academic Master', 'title' => 'Academic Master'],
            ['name' => 'Fatuma Ally', 'role' => 'Admissions Officer', 'title' => 'Admissions Officer'],
            ['name' => 'Peter Nyerere', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Form 1', 'class' => 'Form 1', 'subject' => 'Basic Mathematics'],
            ['name' => 'Neema Kessy', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Form 2', 'class' => 'Form 2', 'subject' => 'Biology'],
            ['name' => 'David Mwakalinga', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Form 3', 'class' => 'Form 3', 'subject' => 'Chemistry'],
            ['name' => 'Esther Lyimo', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Form 4', 'class' => 'Form 4', 'subject' => 'English Language'],
            ['name' => 'Samuel Kimaro', 'role' => 'Subject Teacher', 'title' => 'Physics Teacher', 'subject' => 'Physics'],
            ['name' => 'Rehema Juma', 'role' => 'Subject Teacher', 'title' => 'Kiswahili Teacher', 'subject' => 'Kiswahili'],
            ['name' => 'Isaac Mollel', 'role' => 'Subject Teacher', 'title' => 'Geography Teacher', 'subject' => 'Geography'],
            ['name' => 'Happiness Shirima', 'role' => 'Subject Teacher', 'title' => 'History Teacher', 'subject' => 'History'],
            ['name' => 'Emmanuel Sanga', 'role' => 'Subject Teacher', 'title' => 'Civics Teacher', 'subject' => 'Civics'],
            ['name' => 'Zainab Hussein', 'role' => 'Subject Teacher', 'title' => 'Commerce Teacher', 'subject' => 'Commerce'],
            ['name' => 'Anna Massawe', 'role' => 'Accountant', 'title' => 'School Accountant'],
            ['name' => 'Godfrey Temba', 'role' => 'Bursar', 'title' => 'Bursar'],
            ['name' => 'Consolata Ngowi', 'role' => 'HR Officer', 'title' => 'HR Officer'],
            ['name' => 'Beatrice Urio', 'role' => 'Librarian', 'title' => 'Librarian'],
            ['name' => 'Salome Mgeni', 'role' => 'Hostel Warden', 'title' => 'Hostel Warden'],
            ['name' => 'Frank Kilonzo', 'role' => 'Transport Officer', 'title' => 'Transport Officer'],
            ['name' => 'Nurse Rose Mbwana', 'role' => 'Nurse', 'title' => 'School Nurse'],
            ['name' => 'Lightness Komba', 'role' => 'Receptionist', 'title' => 'Receptionist'],
            ['name' => 'Hamisi Ramadhani', 'role' => 'Store Keeper', 'title' => 'Store Keeper'],
            ['name' => 'John Mgaya', 'role' => 'Security Officer', 'title' => 'Security Officer'],
        ];

        $i = 0;
        foreach ($roster as $entry) {
            $i++;
            $slug = Str::slug($entry['name']);
            $user = User::create([
                'school_id' => $this->school->id,
                'name' => $entry['name'],
                'email' => "{$slug}@kowakgirls.sc.tz",
                'password' => Hash::make(self::DEMO_PASSWORD),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $user->assignRole($entry['role']);
            $this->staff[$entry['name']] = $user;

            StaffProfile::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'branch_id' => $this->mainBranch->id,
                'staff_number' => 'STF-'.str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'job_title' => $entry['title'],
                'employment_type' => 'full_time',
                'hire_date' => '2024-01-15',
            ]);

            StaffContract::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'contract_type' => 'permanent',
                'start_date' => '2024-01-15',
                'salary' => 900000,
            ]);

            $basicSalary = match (true) {
                in_array($entry['role'], ['Principal', 'Second Master', 'Academic Master']) => 1800000,
                in_array($entry['role'], ['Class Teacher', 'Subject Teacher']) => 1100000,
                default => 750000,
            };
            StaffSalary::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'basic_salary' => $basicSalary,
                'allowances' => 100000,
                'deductions' => 30000,
                'effective_from' => '2026-01-01',
            ]);

            if (isset($entry['class'])) {
                $this->streams[$entry['class']]->update(['class_teacher_id' => $user->id]);
            }

            if (isset($entry['subject'])) {
                $user->subjectsTaught()->attach($this->subjects[$entry['subject']]->id);
            }
        }
    }

    protected function seedStudentsAndGuardians(): void
    {
        $firstNames = ['Amina', 'Neema', 'Zawadi', 'Grace', 'Happiness', 'Joyce', 'Lightness', 'Mariam', 'Rukia', 'Salma', 'Tumaini', 'Upendo', 'Veronica', 'Winnie', 'Yasinta', 'Zuhura', 'Agatha', 'Beatrice', 'Consolata', 'Doreen', 'Editha', 'Faraja', 'Glory', 'Husna', 'Irene', 'Judith', 'Kupendwa', 'Lucy', 'Monica', 'Naomi', 'Olipa', 'Prisca'];
        $lastNames = ['Mushi', 'Kimaro', 'Massawe', 'Ndosi', 'Shayo', 'Temba', 'Urio', 'Swai', 'Mwakalinga', 'Kessy', 'Lyimo', 'Sanga', 'Mgaya', 'Komba', 'Mollel', 'Kway', 'Mrema', 'Ally', 'Juma', 'Hussein'];
        $guardianRelationships = ['mother', 'father', 'guardian'];

        $admissionCounter = 1;
        foreach (['Form 1', 'Form 2', 'Form 3', 'Form 4'] as $className) {
            $class = $this->classes[$className];
            $stream = $this->streams[$className];

            for ($i = 0; $i < 8; $i++) {
                $first = $firstNames[array_rand($firstNames)];
                $last = $lastNames[array_rand($lastNames)];

                $student = Student::create([
                    'school_id' => $this->school->id,
                    'admission_number' => 'KGS-2026-'.str_pad((string) $admissionCounter, 4, '0', STR_PAD_LEFT),
                    'first_name' => $first,
                    'last_name' => $last,
                    'date_of_birth' => now()->subYears(13 + $class->level)->subDays(rand(0, 300))->toDateString(),
                    'gender' => 'female',
                    'status' => 'active',
                    'emergency_contact_name' => "{$last} Family",
                    'emergency_contact_phone' => '0'.rand(700000000, 769999999),
                ]);
                $admissionCounter++;

                StudentEnrollment::create([
                    'school_id' => $this->school->id,
                    'student_id' => $student->id,
                    'academic_year_id' => $this->academicYear->id,
                    'school_class_id' => $class->id,
                    'stream_id' => $stream->id,
                    'status' => 'active',
                    'enrolled_at' => '2026-01-06',
                ]);

                $guardian = Guardian::create([
                    'school_id' => $this->school->id,
                    'name' => $last.' '.($guardianRelationships[0]),
                    'phone' => '0'.rand(700000000, 769999999),
                    'email' => strtolower($last).rand(1, 999).'@example.com',
                    'occupation' => ['Farmer', 'Teacher', 'Trader', 'Nurse', 'Driver'][array_rand(['Farmer', 'Teacher', 'Trader', 'Nurse', 'Driver'])],
                    'address' => 'Musoma',
                ]);
                $guardian->students()->attach($student->id, [
                    'relationship' => $guardianRelationships[array_rand($guardianRelationships)],
                    'is_primary' => true,
                    'is_emergency_contact' => true,
                ]);

                // A handful of guardians also get a Parent-role login, to
                // exercise the parent portal — most stay contact-only, same
                // as a real rollout where portal adoption is partial.
                if ($admissionCounter <= 4) {
                    $guardianUser = User::create([
                        'school_id' => $this->school->id,
                        'name' => $guardian->name,
                        'email' => $guardian->email,
                        'password' => Hash::make(self::DEMO_PASSWORD),
                        'is_active' => true,
                        'email_verified_at' => now(),
                    ]);
                    $guardianUser->assignRole('Parent');
                    $guardian->update(['user_id' => $guardianUser->id]);
                }

                $this->students[] = $student;
            }
        }
    }

    protected function seedAdmissions(): void
    {
        $applicants = [
            ['Faith', 'Mwangosi', 'pending'],
            ['Grace', 'Sirili', 'under_review'],
            ['Editha', 'Materu', 'accepted'],
            ['Beatrice', 'Chuwa', 'rejected'],
            ['Naomi', 'Mbogo', 'pending'],
        ];

        foreach ($applicants as [$first, $last, $status]) {
            AdmissionApplication::create([
                'school_id' => $this->school->id,
                'academic_year_id' => $this->academicYear->id,
                'applying_for_class_id' => $this->classes['Form 1']->id,
                'applicant_first_name' => $first,
                'applicant_last_name' => $last,
                'guardian_name' => "{$last} Family",
                'guardian_phone' => '0'.rand(700000000, 769999999),
                'status' => $status,
            ]);
        }
    }

    protected function seedTimetable(): void
    {
        $periods = [
            ['name' => 'Period 1', 'start' => '07:30', 'end' => '08:10'],
            ['name' => 'Period 2', 'start' => '08:10', 'end' => '08:50'],
            ['name' => 'Period 3', 'start' => '08:50', 'end' => '09:30'],
            ['name' => 'Break', 'start' => '09:30', 'end' => '09:50', 'break' => true],
            ['name' => 'Period 4', 'start' => '09:50', 'end' => '10:30'],
            ['name' => 'Period 5', 'start' => '10:30', 'end' => '11:10'],
            ['name' => 'Period 6', 'start' => '11:10', 'end' => '11:50'],
        ];
        $periodModels = [];
        foreach ($periods as $i => $p) {
            $periodModels[] = TimetablePeriod::create([
                'school_id' => $this->school->id,
                'name' => $p['name'],
                'start_time' => $p['start'],
                'end_time' => $p['end'],
                'sort_order' => $i,
                'is_break' => $p['break'] ?? false,
            ]);
        }
        $teachingPeriods = array_values(array_filter($periodModels, fn ($p) => ! $p->is_break));

        $subjectRotation = array_values($this->subjects);
        $teacherBySubject = [];
        foreach ($this->staff as $user) {
            foreach ($user->subjectsTaught as $subject) {
                $teacherBySubject[$subject->id] = $user->id;
            }
        }

        foreach (['Form 1', 'Form 2'] as $className) {
            $class = $this->classes[$className];
            $stream = $this->streams[$className];

            foreach (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as $day) {
                foreach ($teachingPeriods as $slot => $period) {
                    $subject = $subjectRotation[$slot % count($subjectRotation)];
                    $teacherId = $teacherBySubject[$subject->id] ?? $this->staff['Agnes Mrema']->id;

                    TimetableEntry::create([
                        'school_id' => $this->school->id,
                        'school_class_id' => $class->id,
                        'stream_id' => $stream->id,
                        'subject_id' => $subject->id,
                        'teacher_id' => $teacherId,
                        'timetable_period_id' => $period->id,
                        'academic_year_id' => $this->academicYear->id,
                        'day_of_week' => $day,
                    ]);
                }
            }
        }
    }

    protected function seedAttendance(): void
    {
        $service = app(AttendanceService::class);
        $markedBy = $this->staff['Grace Mushi']->id;

        foreach (['Form 1', 'Form 2', 'Form 3', 'Form 4'] as $className) {
            $class = $this->classes[$className];
            $stream = $this->streams[$className];
            $enrolled = StudentEnrollment::where('school_class_id', $class->id)->pluck('student_id');

            foreach ([now()->subDays(2), now()->subDays(1), now()] as $date) {
                $records = [];
                foreach ($enrolled as $studentId) {
                    $roll = rand(1, 20);
                    $status = match (true) {
                        $roll === 1 => 'absent',
                        $roll === 2 => 'late',
                        $roll === 3 => 'excused',
                        default => 'present',
                    };
                    $records[] = [
                        'student_id' => $studentId,
                        'school_class_id' => $class->id,
                        'stream_id' => $stream->id,
                        'academic_year_id' => $this->academicYear->id,
                        'date' => $date->toDateString(),
                        'status' => $status,
                    ];
                }
                $service->markBulk($records, $markedBy);
            }
        }
    }

    protected function seedHomework(): void
    {
        $service = app(HomeworkService::class);

        $assignments = [
            ['Form 1', 'Basic Mathematics', 'Peter Nyerere', 'Algebra worksheet — Chapter 3'],
            ['Form 2', 'Biology', 'Neema Kessy', 'Cell structure diagram labeling'],
            ['Form 3', 'Chemistry', 'David Mwakalinga', 'Balancing chemical equations'],
            ['Form 4', 'English Language', 'Esther Lyimo', 'Essay: My Future Career'],
        ];

        foreach ($assignments as [$className, $subjectName, $teacherName, $title]) {
            $class = $this->classes[$className];
            $homework = $service->create([
                'school_id' => $this->school->id,
                'school_class_id' => $class->id,
                'stream_id' => $this->streams[$className]->id,
                'subject_id' => $this->subjects[$subjectName]->id,
                'teacher_id' => $this->staff[$teacherName]->id,
                'academic_year_id' => $this->academicYear->id,
                'title' => $title,
                'description' => "Complete and submit: {$title}",
                'due_date' => now()->addDays(5)->toDateString(),
            ]);

            $submissions = $homework->submissions()->get();
            foreach ($submissions as $i => $submission) {
                if ($i % 3 === 0) {
                    $submission->update([
                        'status' => 'graded',
                        'submitted_at' => now()->subDay(),
                        'grade' => rand(60, 95),
                        'feedback' => 'Good effort, keep it up.',
                    ]);
                } elseif ($i % 3 === 1) {
                    $submission->update(['status' => 'submitted', 'submitted_at' => now()->subHours(6)]);
                }
            }
        }
    }

    protected function seedExams(): void
    {
        $service = app(ExamService::class);

        $exam = Exam::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'term_id' => $this->term2->id,
            'name' => 'Mid-Term Examination',
            'exam_type' => 'midterm',
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->subDays(6)->toDateString(),
            'status' => 'completed',
        ]);

        foreach (['Form 1', 'Form 2', 'Form 3', 'Form 4'] as $className) {
            $class = $this->classes[$className];

            foreach (['Basic Mathematics', 'English Language', 'Biology'] as $subjectName) {
                $examSubject = $service->addSubject($exam, [
                    'school_class_id' => $class->id,
                    'subject_id' => $this->subjects[$subjectName]->id,
                    'max_marks' => 100,
                    'pass_marks' => 40,
                    'exam_date' => now()->subDays(8)->toDateString(),
                ]);

                foreach ($examSubject->results as $result) {
                    $service->recordMarks($result, (float) rand(35, 98), null, $this->staff['Agnes Mrema']->id);
                }
            }
        }

        $exam->update(['status' => 'published']);

        foreach (array_slice($this->students, 0, 3) as $student) {
            ReportCardRemark::create([
                'school_id' => $this->school->id,
                'exam_id' => $exam->id,
                'student_id' => $student->id,
                'remark' => 'A consistent performer this term — keep up the good work.',
                'entered_by' => $this->staff['Grace Mushi']->id,
            ]);
        }

        // Demonstrate the graduation/leaver tracking module on one student
        // via the real Student model hook, not a raw insert.
        $transferring = $this->students[array_key_last($this->students)];
        $transferring->statusChangeReason = 'Family relocated to Arusha';
        $transferring->statusChangeDate = now()->toDateString();
        $transferring->update(['status' => 'transferred']);
    }

    protected function seedAnnouncementsAndMessaging(): void
    {
        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Welcome back for Term 2',
            'body' => 'Classes resume Monday 25th May. Please ensure fees are settled before reporting.',
            'audience' => 'school',
            'created_by' => $this->staff['Grace Mushi']->id,
            'published_at' => now(),
        ]);

        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Form 1 Parents Meeting',
            'body' => 'A parents meeting for Form 1 will be held this Saturday at 10am.',
            'audience' => 'class',
            'school_class_id' => $this->classes['Form 1']->id,
            'created_by' => $this->staff['Peter Nyerere']->id,
            'published_at' => now(),
        ]);

        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Staff Meeting Friday',
            'body' => 'All teaching staff to attend the Friday afternoon staff meeting.',
            'audience' => 'role',
            'role' => 'Subject Teacher',
            'created_by' => $this->staff['Agnes Mrema']->id,
            'published_at' => now(),
        ]);

        $conversation = Conversation::create([
            'school_id' => $this->school->id,
            'user_one_id' => $this->staff['Grace Mushi']->id,
            'user_two_id' => $this->staff['Agnes Mrema']->id,
            'last_message_at' => now(),
        ]);
        foreach ([
            [$this->staff['Grace Mushi']->id, 'Can you prepare the mid-term academic report by Friday?'],
            [$this->staff['Agnes Mrema']->id, 'Yes, I will have it ready by Thursday.'],
            [$this->staff['Grace Mushi']->id, 'Thank you.'],
        ] as [$senderId, $body]) {
            Message::create([
                'school_id' => $this->school->id,
                'conversation_id' => $conversation->id,
                'sender_id' => $senderId,
                'body' => $body,
            ]);
        }
    }

    protected function seedLeaveAndStaffAttendance(): void
    {
        $leaveEntries = [
            ['Rehema Juma', 'sick', 'approved'],
            ['Frank Kilonzo', 'annual', 'pending'],
            ['Beatrice Urio', 'annual', 'rejected'],
        ];
        foreach ($leaveEntries as [$name, $type, $status]) {
            LeaveRequest::create([
                'school_id' => $this->school->id,
                'user_id' => $this->staff[$name]->id,
                'leave_type' => $type,
                'start_date' => now()->addDays(10)->toDateString(),
                'end_date' => now()->addDays(13)->toDateString(),
                'reason' => 'Personal matters',
                'status' => $status,
                'reviewed_by' => $status !== 'pending' ? $this->staff['Consolata Ngowi']->id : null,
                'reviewed_at' => $status !== 'pending' ? now() : null,
            ]);
        }

        $service = app(StaffAttendanceService::class);
        $markedBy = $this->staff['Consolata Ngowi']->id;
        foreach ([now()->subDays(2), now()->subDays(1), now()] as $date) {
            $records = [];
            foreach ($this->staff as $user) {
                $records[] = [
                    'user_id' => $user->id,
                    'date' => $date->toDateString(),
                    'status' => rand(1, 15) === 1 ? 'absent' : 'present',
                ];
            }
            $service->markBulk($records, $markedBy);
        }
    }

    protected function seedFinance(): void
    {
        $categories = [
            'Tuition Fee' => 300000,
            'Uniform Fee' => 50000,
            'Examination Fee' => 20000,
            'Boarding Fee' => 250000,
        ];
        $feeStructures = [];
        foreach ($categories as $name => $amount) {
            $category = FeeCategory::create(['school_id' => $this->school->id, 'name' => $name]);
            $feeStructures[] = FeeStructure::create([
                'school_id' => $this->school->id,
                'academic_year_id' => $this->academicYear->id,
                'term_id' => $this->term2->id,
                'fee_category_id' => $category->id,
                'amount' => $amount,
                'due_date' => now()->addDays(20)->toDateString(),
            ])->id;
        }

        $invoiceService = app(InvoiceService::class);
        $receivedBy = $this->staff['Anna Massawe']->id;
        $invoiceCount = 0;
        foreach (array_keys($this->classes) as $className) {
            $invoices = $invoiceService->generateForClass([
                'fee_structure_ids' => $feeStructures,
                'academic_year_id' => $this->academicYear->id,
                'term_id' => $this->term2->id,
                'school_class_id' => $this->classes[$className]->id,
                'due_date' => now()->addDays(20)->toDateString(),
            ]);

            foreach ($invoices as $invoice) {
                $invoiceCount++;
                if ($invoiceCount % 3 === 0) {
                    $invoiceService->recordPayment($invoice, [
                        'amount' => (float) $invoice->total_amount,
                        'method' => 'mobile_money',
                        'provider' => 'M-Pesa',
                        'paid_at' => now()->subDays(2)->toDateString(),
                    ], $receivedBy);
                } elseif ($invoiceCount % 3 === 1) {
                    $invoiceService->recordPayment($invoice, [
                        'amount' => round((float) $invoice->total_amount * 0.4, 2),
                        'method' => 'cash',
                        'paid_at' => now()->subDay()->toDateString(),
                    ], $receivedBy);
                }
                // remaining third stays fully unpaid
            }
        }

        $expenseCategories = [];
        foreach (['Utilities', 'Maintenance', 'Teaching Supplies', 'Fuel & Transport'] as $name) {
            $expenseCategories[$name] = ExpenseCategory::create(['school_id' => $this->school->id, 'name' => $name]);
        }
        foreach ([
            ['Utilities', 180000, 'Electricity bill — May'],
            ['Maintenance', 95000, 'Classroom window repairs'],
            ['Teaching Supplies', 60000, 'Chalk, markers, exercise books'],
            ['Fuel & Transport', 220000, 'School bus fuel — May'],
        ] as [$catName, $amount, $desc]) {
            Expense::create([
                'school_id' => $this->school->id,
                'expense_category_id' => $expenseCategories[$catName]->id,
                'amount' => $amount,
                'description' => $desc,
                'expense_date' => now()->subDays(rand(1, 20))->toDateString(),
                'recorded_by' => $this->staff['Godfrey Temba']->id,
            ]);
        }
        foreach ($expenseCategories as $name => $category) {
            Budget::create([
                'school_id' => $this->school->id,
                'expense_category_id' => $category->id,
                'academic_year_id' => $this->academicYear->id,
                'amount' => 2000000,
            ]);
        }

        $payrollRun = PayrollRun::create([
            'school_id' => $this->school->id,
            'month' => (int) now()->format('n'),
            'year' => (int) now()->format('Y'),
        ]);
        app(PayrollService::class)->processRun($payrollRun);
    }

    protected function seedFacilities(): void
    {
        $books = [
            ['Advanced Mathematics for Secondary Schools', 'J. Kileo', 6],
            ['Biology for East Africa', 'A. Massawe', 5],
            ['Chemistry Made Simple', 'P. Ndosi', 5],
            ['English Grammar in Use', 'R. Murphy', 8],
            ['Kiswahili Sanifu', 'TATAKI', 6],
        ];
        $bookModels = [];
        foreach ($books as [$title, $author, $copies]) {
            $bookModels[] = Book::create([
                'school_id' => $this->school->id,
                'title' => $title,
                'author' => $author,
                'category' => 'Textbook',
                'total_copies' => $copies,
                'available_copies' => $copies,
            ]);
        }
        $libraryService = app(LibraryService::class);
        foreach (array_slice($this->students, 0, 5) as $i => $student) {
            $libraryService->borrow($bookModels[$i % count($bookModels)], [
                'student_id' => $student->id,
                'borrowed_at' => now()->subDays(10)->toDateString(),
                'due_date' => now()->subDays(3)->toDateString(),
            ]);
        }
        // Mark one loan overdue for realism (its due_date has already passed).
        $bookModels[0]->loans()->first()?->update(['status' => 'overdue']);

        foreach (['Iris House', 'Jasmine House', 'Lily House'] as $roomName) {
            HostelRoom::create([
                'school_id' => $this->school->id,
                'name' => $roomName,
                'type' => 'girls',
                'capacity' => 6,
            ]);
        }
        $hostelService = app(HostelService::class);
        $rooms = HostelRoom::where('school_id', $this->school->id)->get();
        foreach (array_slice($this->students, 0, 8) as $i => $student) {
            $hostelService->allocate([
                'student_id' => $student->id,
                'hostel_room_id' => $rooms[$i % $rooms->count()]->id,
                'academic_year_id' => $this->academicYear->id,
                'allocated_at' => '2026-01-06',
            ]);
        }

        $routes = [];
        foreach (['Musoma Town Route', 'Bunda Road Route'] as $routeName) {
            $routes[] = TransportRoute::create([
                'school_id' => $this->school->id,
                'name' => $routeName,
                'driver_name' => 'Mzee '.explode(' ', $routeName)[0],
                'driver_phone' => '0'.rand(700000000, 769999999),
                'capacity' => 30,
            ]);
        }
        $transportService = app(TransportService::class);
        foreach (array_slice($this->students, 8, 10) as $i => $student) {
            $transportService->assign([
                'student_id' => $student->id,
                'transport_route_id' => $routes[$i % count($routes)]->id,
                'academic_year_id' => $this->academicYear->id,
                'pickup_point' => 'Stage '.($i + 1),
            ]);
        }

        $items = [];
        foreach ([
            ['Exercise Books', 'Stationery', 'pieces', 500, 100],
            ['Chalk Boxes', 'Stationery', 'boxes', 50, 10],
            ['Desks', 'Furniture', 'pieces', 200, 20],
            ['Footballs', 'Sports', 'pieces', 10, 2],
        ] as [$name, $category, $unit, $qty, $reorder]) {
            $items[$name] = InventoryItem::create([
                'school_id' => $this->school->id,
                'name' => $name,
                'category' => $category,
                'unit' => $unit,
                'quantity' => $qty,
                'reorder_level' => $reorder,
            ]);
        }
        $inventoryService = app(InventoryService::class);
        $inventoryService->recordTransaction([
            'inventory_item_id' => $items['Exercise Books']->id,
            'type' => 'out',
            'quantity' => 160,
            'reason' => 'Issued to Form 1-4 for Term 2',
            'transaction_date' => now()->subDays(3)->toDateString(),
        ], $this->staff['Hamisi Ramadhani']->id);
        $inventoryService->recordTransaction([
            'inventory_item_id' => $items['Chalk Boxes']->id,
            'type' => 'in',
            'quantity' => 20,
            'reason' => 'Restocked from supplier',
            'transaction_date' => now()->subDays(5)->toDateString(),
        ], $this->staff['Hamisi Ramadhani']->id);

        foreach (array_slice($this->students, 0, 4) as $i => $student) {
            ClinicVisit::create([
                'school_id' => $this->school->id,
                'student_id' => $student->id,
                'visit_date' => now()->subDays($i + 1)->toDateString(),
                'reason' => ['Headache', 'Stomach ache', 'Minor injury', 'Fever'][$i],
                'diagnosis' => 'Mild, resolved with rest and observation',
                'treatment' => 'Paracetamol and rest in sick bay',
                'recorded_by' => $this->staff['Nurse Rose Mbwana']->id,
            ]);
        }

        for ($d = 0; $d < 5; $d++) {
            CafeteriaMenu::create([
                'school_id' => $this->school->id,
                'menu_date' => now()->addDays($d)->toDateString(),
                'meal_type' => 'lunch',
                'description' => ['Rice, beans and vegetables', 'Ugali, fish and greens', 'Pilau with salad', 'Rice, beef stew and cabbage', 'Ugali, beans and spinach'][$d],
            ]);
        }
    }

    protected function seedDiscipline(): void
    {
        $incidents = [
            ['minor', 'Late to class', 'open'],
            ['moderate', 'Uniform violation', 'resolved'],
            ['major', 'Fighting with another student', 'resolved'],
            ['minor', 'Noise making during prep', 'open'],
        ];
        foreach ($incidents as $i => [$severity, $category, $status]) {
            DisciplineIncident::create([
                'school_id' => $this->school->id,
                'student_id' => $this->students[$i]->id,
                'incident_date' => now()->subDays($i + 1)->toDateString(),
                'category' => $category,
                'severity' => $severity,
                'description' => "Incident reported: {$category}.",
                'action_taken' => $status === 'resolved' ? 'Verbal warning issued and parent notified.' : null,
                'status' => $status,
                'reported_by' => $this->staff['Joseph Kway']->id,
            ]);
        }
    }

    protected function seedLms(): void
    {
        $courses = [
            ['Form 1', 'Basic Mathematics', 'Peter Nyerere', 'Introduction to Algebra'],
            ['Form 2', 'Biology', 'Neema Kessy', 'Cell Biology Fundamentals'],
        ];
        foreach ($courses as [$className, $subjectName, $teacherName, $title]) {
            $course = Course::create([
                'school_id' => $this->school->id,
                'subject_id' => $this->subjects[$subjectName]->id,
                'school_class_id' => $this->classes[$className]->id,
                'teacher_id' => $this->staff[$teacherName]->id,
                'title' => $title,
                'description' => "Course materials for {$title}",
                'is_published' => true,
            ]);

            foreach (['Lesson 1: Getting Started', 'Lesson 2: Core Concepts', 'Lesson 3: Practice & Review'] as $order => $lessonTitle) {
                Lesson::create([
                    'school_id' => $this->school->id,
                    'course_id' => $course->id,
                    'title' => $lessonTitle,
                    'content' => 'Lesson content notes go here.',
                    'sort_order' => $order,
                ]);
            }
        }
    }
}
