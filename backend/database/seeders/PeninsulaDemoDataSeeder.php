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
 * One-off demo dataset for PENINSULA ENGLISH MEDIUM SCHOOL, a day primary
 * school. Unlike KowakDemoDataSeeder (which assumes the school is already
 * registered), this seeder also registers the School + its School Owner
 * login if no matching school exists yet, then seeds every module.
 *
 * No Faker (fakerphp/faker is require-dev only; production runs
 * `composer install --no-dev`). Every demo login shares DEMO_PASSWORD —
 * throwaway data for one specific demo school, not a security-sensitive path.
 *
 * Being a day school (no boarding), the hostel module is deliberately left
 * unseeded here — everything else (structure, staff, students, fees,
 * timetable, attendance, exams, transport, library, discipline, LMS, etc.)
 * is covered.
 */
class PeninsulaDemoDataSeeder extends Seeder
{
    protected const SCHOOL_EMAIL = 'peninsula@gmail.com';

    protected const SCHOOL_NAME = 'PENINSULA ENGLISH MEDIUM SCHOOL';

    protected const DEMO_PASSWORD = 'Peninsula@Demo2026';

    protected const STUDENTS_PER_CLASS = 40;

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
        $existing = School::where('email', self::SCHOOL_EMAIL)
            ->orWhere('name', 'like', '%PENINSULA%')
            ->first();

        if ($existing) {
            $this->school = $existing;
        } else {
            $this->school = $this->registerSchool();
            $this->command->info("Registered new school: {$this->school->name} ({$this->school->id})");
        }

        // See KowakDemoDataSeeder for why Tenant::set() must happen before
        // the idempotency guard: BelongsToSchool's global scope needs an
        // active tenant for an explicit ->where('school_id', ...) to match
        // anything at all.
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

        $this->command->info('Done. Every demo login password is: '.self::DEMO_PASSWORD);
    }

    /**
     * Registers the school itself plus its School Owner login. Approved
     * immediately (rather than left 'pending') since this is demo content
     * meant to be usable right away, not a real applicant awaiting Super
     * Admin review.
     */
    protected function registerSchool(): School
    {
        return Tenant::runAsPlatform(function () {
            $school = School::create([
                'name' => self::SCHOOL_NAME,
                'slug' => 'peninsula-english-medium-school',
                'type' => 'primary',
                'status' => 'approved',
                'email' => self::SCHOOL_EMAIL,
                'phone' => '+255754112233',
                'address' => 'Peninsula Road, Msasani',
                'city' => 'Dar es Salaam',
                'country' => 'TZ',
                'timezone' => 'Africa/Dar_es_Salaam',
                'currency' => 'TZS',
                'approved_at' => now(),
            ]);

            $owner = User::create([
                'school_id' => $school->id,
                'name' => 'Mwanahawa Said',
                'email' => self::SCHOOL_EMAIL,
                'password' => Hash::make(self::DEMO_PASSWORD),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $owner->assignRole('School Owner');

            return $school;
        });
    }

    protected function seedStructure(): void
    {
        $this->mainBranch = Branch::create([
            'school_id' => $this->school->id,
            'name' => 'Main Campus',
            'city' => $this->school->city ?? 'Dar es Salaam',
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
            'Languages' => 'LANG',
            'Mathematics & Science' => 'MSC',
            'Humanities' => 'HUM',
            'Creative & Physical Education' => 'CPE',
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
            'name' => 'Primary School Assessment Scale',
            'is_default' => true,
        ]);
        $gradingSystem->gradeBands()->createMany([
            ['label' => 'A', 'min_score' => 75, 'max_score' => 100, 'remark' => 'Excellent', 'gpa' => 1.0],
            ['label' => 'B', 'min_score' => 60, 'max_score' => 74, 'remark' => 'Very Good', 'gpa' => 2.0],
            ['label' => 'C', 'min_score' => 50, 'max_score' => 59, 'remark' => 'Good', 'gpa' => 3.0],
            ['label' => 'D', 'min_score' => 30, 'max_score' => 49, 'remark' => 'Satisfactory', 'gpa' => 4.0],
            ['label' => 'E', 'min_score' => 0, 'max_score' => 29, 'remark' => 'Fail', 'gpa' => 5.0],
        ]);

        $subjectDefs = [
            'English Language' => 'ENG', 'Kiswahili' => 'KISW', 'Mathematics' => 'MATH',
            'Science' => 'SCI', 'Social Studies' => 'SST', 'Civics and Moral Education' => 'CIV',
            'Creative Arts' => 'ART', 'Physical Education' => 'PE', 'Computer Studies' => 'ICT',
            'Religious Education' => 'RE',
        ];
        $subjectDept = [
            'English Language' => 'Languages', 'Kiswahili' => 'Languages',
            'Mathematics' => 'Mathematics & Science', 'Science' => 'Mathematics & Science', 'Computer Studies' => 'Mathematics & Science',
            'Social Studies' => 'Humanities', 'Civics and Moral Education' => 'Humanities', 'Religious Education' => 'Humanities',
            'Creative Arts' => 'Creative & Physical Education', 'Physical Education' => 'Creative & Physical Education',
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
        foreach (['1', '2', '3', '4', '5', '6', '7', 'ICT Lab'] as $roomName) {
            $rooms[$roomName] = Room::create([
                'school_id' => $this->school->id,
                'branch_id' => $this->mainBranch->id,
                'name' => str_starts_with($roomName, 'ICT') ? $roomName : 'Room '.$roomName,
                'capacity' => self::STUDENTS_PER_CLASS,
                'type' => str_starts_with($roomName, 'ICT') ? 'lab' : 'classroom',
            ]);
        }

        foreach ([1, 2, 3, 4, 5, 6, 7] as $level) {
            $class = SchoolClass::create([
                'school_id' => $this->school->id,
                'branch_id' => $this->mainBranch->id,
                'name' => "Standard {$level}",
                'level' => $level,
            ]);
            $this->classes["Standard {$level}"] = $class;

            $class->subjects()->attach(collect($this->subjects)->pluck('id'));

            $this->streams["Standard {$level}"] = Stream::create([
                'school_id' => $this->school->id,
                'school_class_id' => $class->id,
                'academic_year_id' => $this->academicYear->id,
                'name' => 'A',
                'capacity' => self::STUDENTS_PER_CLASS,
                'room_id' => $rooms[(string) $level]->id,
            ]);
        }
    }

    protected function seedStaff(): void
    {
        $roster = [
            ['name' => 'Grace Mwakalinga', 'role' => 'Head Teacher', 'title' => 'Head Teacher'],
            ['name' => 'Joseph Komba', 'role' => 'Deputy Head Teacher', 'title' => 'Deputy Head Teacher'],
            ['name' => 'Agnes Shirima', 'role' => 'Academic Master', 'title' => 'Academic Master'],
            ['name' => 'Peter Ndosi', 'role' => 'Discipline Master', 'title' => 'Discipline Master'],
            ['name' => 'Neema Massawe', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 1', 'class' => 'Standard 1', 'subject' => 'Mathematics'],
            ['name' => 'David Mollel', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 2', 'class' => 'Standard 2', 'subject' => 'Science'],
            ['name' => 'Esther Lyimo', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 3', 'class' => 'Standard 3', 'subject' => 'English Language'],
            ['name' => 'Samuel Kimaro', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 4', 'class' => 'Standard 4', 'subject' => 'Kiswahili'],
            ['name' => 'Happiness Sanga', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 5', 'class' => 'Standard 5', 'subject' => 'Social Studies'],
            ['name' => 'Rehema Juma', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 6', 'class' => 'Standard 6', 'subject' => 'Civics and Moral Education'],
            ['name' => 'Emmanuel Temba', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 7', 'class' => 'Standard 7', 'subject' => 'Mathematics'],
            ['name' => 'Zainab Hussein', 'role' => 'Subject Teacher', 'title' => 'ICT Teacher', 'subject' => 'Computer Studies'],
            ['name' => 'Isaac Mgaya', 'role' => 'Subject Teacher', 'title' => 'Creative Arts Teacher', 'subject' => 'Creative Arts'],
            ['name' => 'Consolata Ngowi', 'role' => 'Subject Teacher', 'title' => 'Physical Education Teacher', 'subject' => 'Physical Education'],
            ['name' => 'Frank Kilonzo', 'role' => 'Subject Teacher', 'title' => 'Religious Education Teacher', 'subject' => 'Religious Education'],
            ['name' => 'Anna Massawe', 'role' => 'Accountant', 'title' => 'School Accountant'],
            ['name' => 'Godfrey Urio', 'role' => 'Bursar', 'title' => 'Bursar'],
            ['name' => 'Salome Mgeni', 'role' => 'HR Officer', 'title' => 'HR Officer'],
            ['name' => 'Beatrice Chuwa', 'role' => 'Librarian', 'title' => 'Librarian'],
            ['name' => 'Hamisi Ramadhani', 'role' => 'Transport Officer', 'title' => 'Transport Officer'],
            ['name' => 'Nurse Winnie Kway', 'role' => 'Nurse', 'title' => 'School Nurse'],
            ['name' => 'Lightness Mbwana', 'role' => 'Receptionist', 'title' => 'Receptionist'],
            ['name' => 'John Kessy', 'role' => 'Store Keeper', 'title' => 'Store Keeper'],
            ['name' => 'Bakari Juma', 'role' => 'Security Officer', 'title' => 'Security Officer'],
        ];

        $i = 0;
        foreach ($roster as $entry) {
            $i++;
            $slug = Str::slug($entry['name']);
            $user = User::create([
                'school_id' => $this->school->id,
                'name' => $entry['name'],
                'email' => "{$slug}@peninsulaenglish.sc.tz",
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
                'salary' => 700000,
            ]);

            $basicSalary = match (true) {
                in_array($entry['role'], ['Head Teacher', 'Deputy Head Teacher', 'Academic Master']) => 1500000,
                in_array($entry['role'], ['Class Teacher', 'Subject Teacher']) => 900000,
                default => 650000,
            };
            StaffSalary::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'basic_salary' => $basicSalary,
                'allowances' => 80000,
                'deductions' => 25000,
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
        $maleFirstNames = ['Juma', 'Hassan', 'Ibrahim', 'Musa', 'Ali', 'Rashid', 'Salim', 'Omari', 'Bakari', 'Hamisi', 'Said', 'Athumani', 'Iddi', 'Kassim', 'Yusuf', 'Daniel', 'Peter', 'John', 'Joseph', 'Emmanuel'];
        $femaleFirstNames = ['Amina', 'Neema', 'Zawadi', 'Grace', 'Happiness', 'Joyce', 'Lightness', 'Mariam', 'Rukia', 'Salma', 'Tumaini', 'Upendo', 'Winnie', 'Yasinta', 'Zuhura', 'Agatha', 'Beatrice', 'Consolata', 'Doreen', 'Editha'];
        $lastNames = ['Mushi', 'Kimaro', 'Massawe', 'Ndosi', 'Shayo', 'Temba', 'Urio', 'Swai', 'Mwakalinga', 'Kessy', 'Lyimo', 'Sanga', 'Mgaya', 'Komba', 'Mollel', 'Kway', 'Mrema', 'Ally', 'Juma', 'Hussein'];
        $guardianRelationships = ['mother', 'father', 'guardian'];

        $admissionCounter = 1;
        foreach ($this->classes as $className => $class) {
            $stream = $this->streams[$className];

            for ($i = 0; $i < self::STUDENTS_PER_CLASS; $i++) {
                $gender = $admissionCounter % 2 === 0 ? 'female' : 'male';
                $first = $gender === 'female'
                    ? $femaleFirstNames[array_rand($femaleFirstNames)]
                    : $maleFirstNames[array_rand($maleFirstNames)];
                $last = $lastNames[array_rand($lastNames)];

                $student = Student::create([
                    'school_id' => $this->school->id,
                    'admission_number' => 'PEMS-2026-'.str_pad((string) $admissionCounter, 4, '0', STR_PAD_LEFT),
                    'first_name' => $first,
                    'last_name' => $last,
                    'date_of_birth' => now()->subYears(5 + $class->level)->subDays(rand(0, 300))->toDateString(),
                    'gender' => $gender,
                    'status' => 'active',
                    'emergency_contact_name' => "{$last} Family",
                    'emergency_contact_phone' => '0'.rand(700000000, 769999999),
                ]);

                StudentEnrollment::create([
                    'school_id' => $this->school->id,
                    'student_id' => $student->id,
                    'academic_year_id' => $this->academicYear->id,
                    'school_class_id' => $class->id,
                    'stream_id' => $stream->id,
                    'status' => 'active',
                    'enrolled_at' => '2026-01-06',
                ]);

                $guardianRelationship = $guardianRelationships[array_rand($guardianRelationships)];
                $guardian = Guardian::create([
                    'school_id' => $this->school->id,
                    'name' => $last.' '.($guardianRelationship === 'father' ? 'Sr' : 'Family'),
                    'phone' => '0'.rand(700000000, 769999999),
                    'email' => strtolower($last).rand(1, 999).'@example.com',
                    'occupation' => ['Trader', 'Teacher', 'Nurse', 'Driver', 'Civil Servant', 'Business Owner'][array_rand(['Trader', 'Teacher', 'Nurse', 'Driver', 'Civil Servant', 'Business Owner'])],
                    'address' => 'Msasani, Dar es Salaam',
                ]);
                $guardian->students()->attach($student->id, [
                    'relationship' => $guardianRelationship,
                    'is_primary' => true,
                    'is_emergency_contact' => true,
                ]);

                // A handful of guardians also get a Parent-role login, to
                // exercise the parent portal — most stay contact-only, same
                // as a real rollout where portal adoption is partial.
                if ($admissionCounter <= 10) {
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
                $admissionCounter++;
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
                'applying_for_class_id' => $this->classes['Standard 1']->id,
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

        foreach (['Standard 1', 'Standard 2'] as $className) {
            $class = $this->classes[$className];
            $stream = $this->streams[$className];

            foreach (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as $day) {
                foreach ($teachingPeriods as $slot => $period) {
                    $subject = $subjectRotation[$slot % count($subjectRotation)];
                    $teacherId = $teacherBySubject[$subject->id] ?? $this->staff['Agnes Shirima']->id;

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
        $markedBy = $this->staff['Grace Mwakalinga']->id;

        foreach ($this->classes as $className => $class) {
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
            ['Standard 1', 'Mathematics', 'Neema Massawe', 'Counting and number bonds worksheet'],
            ['Standard 3', 'English Language', 'Esther Lyimo', 'Reading comprehension — My Family'],
            ['Standard 5', 'Social Studies', 'Happiness Sanga', 'Map reading exercise — East Africa'],
            ['Standard 7', 'Mathematics', 'Emmanuel Temba', 'Revision worksheet — Fractions and Decimals'],
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

        foreach ($this->classes as $className => $class) {
            foreach (['English Language', 'Mathematics', 'Kiswahili'] as $subjectName) {
                $examSubject = $service->addSubject($exam, [
                    'school_class_id' => $class->id,
                    'subject_id' => $this->subjects[$subjectName]->id,
                    'max_marks' => 100,
                    'pass_marks' => 40,
                    'exam_date' => now()->subDays(8)->toDateString(),
                ]);

                foreach ($examSubject->results as $result) {
                    $service->recordMarks($result, (float) rand(35, 98), null, $this->staff['Agnes Shirima']->id);
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
                'entered_by' => $this->staff['Grace Mwakalinga']->id,
            ]);
        }

        // Demonstrate the graduation/leaver tracking module on one Standard
        // 7 (final-year) student via the real Student model hook, not a raw
        // insert.
        $graduating = $this->students[array_key_last($this->students)];
        $graduating->statusChangeReason = 'Completed primary education — proceeding to secondary school';
        $graduating->statusChangeDate = now()->toDateString();
        $graduating->update(['status' => 'graduated']);
    }

    protected function seedAnnouncementsAndMessaging(): void
    {
        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Welcome back for Term 2',
            'body' => 'Classes resume Monday 25th May. Please ensure fees are settled before reporting.',
            'audience' => 'school',
            'created_by' => $this->staff['Grace Mwakalinga']->id,
            'published_at' => now(),
        ]);

        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Standard 1 Parents Meeting',
            'body' => 'A parents meeting for Standard 1 will be held this Saturday at 10am.',
            'audience' => 'class',
            'school_class_id' => $this->classes['Standard 1']->id,
            'created_by' => $this->staff['Neema Massawe']->id,
            'published_at' => now(),
        ]);

        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Staff Meeting Friday',
            'body' => 'All teaching staff to attend the Friday afternoon staff meeting.',
            'audience' => 'role',
            'role' => 'Class Teacher',
            'created_by' => $this->staff['Agnes Shirima']->id,
            'published_at' => now(),
        ]);

        $conversation = Conversation::create([
            'school_id' => $this->school->id,
            'user_one_id' => $this->staff['Grace Mwakalinga']->id,
            'user_two_id' => $this->staff['Agnes Shirima']->id,
            'last_message_at' => now(),
        ]);
        foreach ([
            [$this->staff['Grace Mwakalinga']->id, 'Can you prepare the mid-term academic report by Friday?'],
            [$this->staff['Agnes Shirima']->id, 'Yes, I will have it ready by Thursday.'],
            [$this->staff['Grace Mwakalinga']->id, 'Thank you.'],
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
            ['Hamisi Ramadhani', 'annual', 'pending'],
            ['Beatrice Chuwa', 'annual', 'rejected'],
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
                'reviewed_by' => $status !== 'pending' ? $this->staff['Salome Mgeni']->id : null,
                'reviewed_at' => $status !== 'pending' ? now() : null,
            ]);
        }

        $service = app(StaffAttendanceService::class);
        $markedBy = $this->staff['Salome Mgeni']->id;
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
            'Tuition Fee' => 150000,
            'Lunch Fee' => 60000,
            'Transport Fee' => 40000,
            'Uniform Fee' => 45000,
            'Examination Fee' => 15000,
            'Activity Fee' => 20000,
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
        foreach (['Utilities', 'Maintenance', 'Teaching & Learning Materials', 'Fuel & Transport'] as $name) {
            $expenseCategories[$name] = ExpenseCategory::create(['school_id' => $this->school->id, 'name' => $name]);
        }
        foreach ([
            ['Utilities', 140000, 'Electricity bill — May'],
            ['Maintenance', 70000, 'Classroom furniture repairs'],
            ['Teaching & Learning Materials', 90000, 'Exercise books, charts and stationery'],
            ['Fuel & Transport', 160000, 'School van fuel — May'],
        ] as [$catName, $amount, $desc]) {
            Expense::create([
                'school_id' => $this->school->id,
                'expense_category_id' => $expenseCategories[$catName]->id,
                'amount' => $amount,
                'description' => $desc,
                'expense_date' => now()->subDays(rand(1, 20))->toDateString(),
                'recorded_by' => $this->staff['Godfrey Urio']->id,
            ]);
        }
        foreach ($expenseCategories as $name => $category) {
            Budget::create([
                'school_id' => $this->school->id,
                'expense_category_id' => $category->id,
                'academic_year_id' => $this->academicYear->id,
                'amount' => 1500000,
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
            ['Oxford Junior English Dictionary', 'Oxford Press', 6],
            ['Primary Mathematics Workbook 1-7', 'TIE', 8],
            ['Kiswahili Kwanza', 'TATAKI', 6],
            ['Science for Primary Schools', 'A. Massawe', 5],
            ['Atlas for East African Schools', 'Macmillan', 4],
            ['Favourite Fables and Folktales', 'Various', 5],
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
        foreach (array_slice($this->students, 0, 6) as $i => $student) {
            $libraryService->borrow($bookModels[$i % count($bookModels)], [
                'student_id' => $student->id,
                'borrowed_at' => now()->subDays(10)->toDateString(),
                'due_date' => now()->subDays(3)->toDateString(),
            ]);
        }
        // Mark one loan overdue for realism (its due_date has already passed).
        $bookModels[0]->loans()->first()?->update(['status' => 'overdue']);

        $routes = [];
        foreach (['Msasani Route', 'Mikocheni Route', 'Sinza Route'] as $routeName) {
            $routes[] = TransportRoute::create([
                'school_id' => $this->school->id,
                'name' => $routeName,
                'driver_name' => 'Mzee '.explode(' ', $routeName)[0],
                'driver_phone' => '0'.rand(700000000, 769999999),
                'capacity' => 30,
            ]);
        }
        $transportService = app(TransportService::class);
        foreach (array_slice($this->students, 0, 30) as $i => $student) {
            $transportService->assign([
                'student_id' => $student->id,
                'transport_route_id' => $routes[$i % count($routes)]->id,
                'academic_year_id' => $this->academicYear->id,
                'pickup_point' => 'Stage '.($i + 1),
            ]);
        }

        $items = [];
        foreach ([
            ['Exercise Books', 'Stationery', 'pieces', 800, 200],
            ['Chalk Boxes', 'Stationery', 'boxes', 60, 15],
            ['Desks', 'Furniture', 'pieces', 300, 30],
            ['Footballs', 'Sports', 'pieces', 12, 3],
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
            'quantity' => 280,
            'reason' => 'Issued to Standard 1-7 for Term 2',
            'transaction_date' => now()->subDays(3)->toDateString(),
        ], $this->staff['John Kessy']->id);
        $inventoryService->recordTransaction([
            'inventory_item_id' => $items['Chalk Boxes']->id,
            'type' => 'in',
            'quantity' => 25,
            'reason' => 'Restocked from supplier',
            'transaction_date' => now()->subDays(5)->toDateString(),
        ], $this->staff['John Kessy']->id);

        foreach (array_slice($this->students, 0, 4) as $i => $student) {
            ClinicVisit::create([
                'school_id' => $this->school->id,
                'student_id' => $student->id,
                'visit_date' => now()->subDays($i + 1)->toDateString(),
                'reason' => ['Headache', 'Stomach ache', 'Minor injury', 'Fever'][$i],
                'diagnosis' => 'Mild, resolved with rest and observation',
                'treatment' => 'Paracetamol and rest in sick bay',
                'recorded_by' => $this->staff['Nurse Winnie Kway']->id,
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
            ['minor', 'Talking during class', 'open'],
            ['minor', 'Late to school', 'resolved'],
            ['moderate', 'Rough play during break', 'resolved'],
            ['minor', 'Incomplete homework', 'open'],
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
                'reported_by' => $this->staff['Peter Ndosi']->id,
            ]);
        }
    }

    protected function seedLms(): void
    {
        $courses = [
            ['Standard 3', 'Mathematics', 'Esther Lyimo', 'Introduction to Fractions'],
            ['Standard 5', 'Science', 'Happiness Sanga', 'The Human Body Basics'],
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
