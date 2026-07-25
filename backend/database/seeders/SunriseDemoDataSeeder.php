<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\Announcement;
use App\Models\Book;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Exam;
use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Guardian;
use App\Models\Holiday;
use App\Models\PayrollRun;
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
use App\Models\TransportRoute;
use App\Models\User;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PayrollService;
use App\Services\School\AttendanceService;
use App\Services\School\ExamService;
use App\Services\School\TransportService;
use App\Support\Tenancy\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * A lean, local-only (never run in production) demo school used purely to
 * source realistic numbers/screenshots for the sales presentation — smaller
 * than PeninsulaDemoDataSeeder (5 classes, not 7; ~25/class, not 40) since
 * a pitch deck only needs believable totals, not a full year of history.
 */
class SunriseDemoDataSeeder extends Seeder
{
    protected const SCHOOL_NAME = 'SUNRISE PRIMARY ACADEMY';

    protected const DEMO_PASSWORD = 'Sunrise@Demo2026';

    protected const STUDENTS_PER_CLASS = 25;

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
        $existing = School::where('name', 'like', '%SUNRISE%')->first();

        if ($existing) {
            $this->school = $existing;
        } else {
            $this->school = $this->registerSchool();
            $this->command->info("Registered new school: {$this->school->name} ({$this->school->id})");
        }

        Tenant::set($this->school->id);

        if (Student::where('school_id', $this->school->id)->exists()) {
            $this->command->warn("Demo data already exists for {$this->school->name} — skipping to avoid duplicates.");

            return;
        }

        DB::transaction(function () {
            $this->seedStructure();
            $this->seedStaff();
            $this->seedStudentsAndGuardians();
            $this->seedAdmissions();
            $this->seedAttendance();
            $this->seedExams();
            $this->seedAnnouncements();
            $this->seedFinance();
            $this->seedFacilities();
        });

        $this->command->info('Done. Every demo login password is: '.self::DEMO_PASSWORD);
    }

    protected function registerSchool(): School
    {
        return Tenant::runAsPlatform(function () {
            $school = School::create([
                'name' => self::SCHOOL_NAME,
                'slug' => 'sunrise-primary-academy',
                'type' => 'primary',
                'status' => 'approved',
                'email' => 'info@sunriseprimary.test',
                'phone' => '+255754998877',
                'address' => 'Kinondoni Road',
                'city' => 'Dar es Salaam',
                'country' => 'TZ',
                'timezone' => 'Africa/Dar_es_Salaam',
                'currency' => 'TZS',
                'approved_at' => now(),
                'license_expires_at' => now()->addMonths(12),
            ]);

            $owner = User::create([
                'school_id' => $school->id,
                'name' => 'Grace Mwakalinga',
                'email' => 'info@sunriseprimary.test',
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
            'city' => 'Dar es Salaam',
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

        $departments = ['Languages' => 'LANG', 'Mathematics & Science' => 'MSC', 'Humanities' => 'HUM'];
        $departmentModels = [];
        foreach ($departments as $name => $code) {
            $departmentModels[$name] = Department::create(['school_id' => $this->school->id, 'name' => $name, 'code' => $code]);
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
            'English Language' => ['ENG', 'Languages'], 'Kiswahili' => ['KISW', 'Languages'],
            'Mathematics' => ['MATH', 'Mathematics & Science'], 'Science' => ['SCI', 'Mathematics & Science'],
            'Social Studies' => ['SST', 'Humanities'], 'Civics' => ['CIV', 'Humanities'],
        ];
        foreach ($subjectDefs as $name => [$code, $dept]) {
            $this->subjects[$name] = Subject::create([
                'school_id' => $this->school->id,
                'department_id' => $departmentModels[$dept]->id,
                'name' => $name,
                'code' => $code,
            ]);
        }

        $rooms = [];
        foreach (['1', '2', '3', '4', '5'] as $roomName) {
            $rooms[$roomName] = Room::create([
                'school_id' => $this->school->id,
                'branch_id' => $this->mainBranch->id,
                'name' => 'Room '.$roomName,
                'capacity' => self::STUDENTS_PER_CLASS,
                'type' => 'classroom',
            ]);
        }

        foreach ([1, 2, 3, 4, 5] as $level) {
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
            ['name' => 'Grace Mwakalinga', 'role' => 'Head Teacher', 'title' => 'Head Teacher', 'skip_user' => true],
            ['name' => 'Joseph Komba', 'role' => 'Deputy Head Teacher', 'title' => 'Deputy Head Teacher'],
            ['name' => 'Agnes Shirima', 'role' => 'Academic Master', 'title' => 'Academic Master'],
            ['name' => 'Neema Massawe', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 1', 'class' => 'Standard 1', 'subject' => 'Mathematics'],
            ['name' => 'David Mollel', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 2', 'class' => 'Standard 2', 'subject' => 'Science'],
            ['name' => 'Esther Lyimo', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 3', 'class' => 'Standard 3', 'subject' => 'English Language'],
            ['name' => 'Samuel Kimaro', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 4', 'class' => 'Standard 4', 'subject' => 'Kiswahili'],
            ['name' => 'Happiness Sanga', 'role' => 'Class Teacher', 'title' => 'Class Teacher — Standard 5', 'class' => 'Standard 5', 'subject' => 'Social Studies'],
            ['name' => 'Zainab Hussein', 'role' => 'Subject Teacher', 'title' => 'ICT Teacher', 'subject' => 'Civics'],
            ['name' => 'Anna Massawe', 'role' => 'Accountant', 'title' => 'School Accountant'],
            ['name' => 'Godfrey Urio', 'role' => 'Bursar', 'title' => 'Bursar'],
            ['name' => 'Beatrice Chuwa', 'role' => 'Librarian', 'title' => 'Librarian'],
            ['name' => 'Hamisi Ramadhani', 'role' => 'Transport Officer', 'title' => 'Transport Officer'],
            ['name' => 'Lightness Mbwana', 'role' => 'Receptionist', 'title' => 'Receptionist'],
        ];

        $i = 0;
        foreach ($roster as $entry) {
            $i++;
            $slug = Str::slug($entry['name']);

            if (! empty($entry['skip_user'])) {
                // The Head Teacher here doubles as the School Owner account
                // created in registerSchool() — don't create a duplicate login.
                $user = User::where('school_id', $this->school->id)->where('email', 'info@sunriseprimary.test')->first();
            } else {
                $user = User::create([
                    'school_id' => $this->school->id,
                    'name' => $entry['name'],
                    'email' => "{$slug}@sunriseprimary.test",
                    'password' => Hash::make(self::DEMO_PASSWORD),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
                $user->assignRole($entry['role']);
            }

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
        $maleFirstNames = ['Juma', 'Hassan', 'Ibrahim', 'Musa', 'Ali', 'Rashid', 'Salim', 'Omari', 'Bakari', 'Daniel'];
        $femaleFirstNames = ['Amina', 'Neema', 'Zawadi', 'Grace', 'Happiness', 'Joyce', 'Mariam', 'Rukia', 'Salma', 'Winnie'];
        $lastNames = ['Mushi', 'Kimaro', 'Massawe', 'Ndosi', 'Shayo', 'Temba', 'Urio', 'Swai', 'Mwakalinga', 'Kessy'];

        $admissionCounter = 1;
        foreach ($this->classes as $className => $class) {
            $stream = $this->streams[$className];

            for ($i = 0; $i < self::STUDENTS_PER_CLASS; $i++) {
                $gender = $admissionCounter % 2 === 0 ? 'female' : 'male';
                $first = $gender === 'female' ? $femaleFirstNames[array_rand($femaleFirstNames)] : $maleFirstNames[array_rand($maleFirstNames)];
                $last = $lastNames[array_rand($lastNames)];

                $student = Student::create([
                    'school_id' => $this->school->id,
                    'admission_number' => 'SPA-2026-'.str_pad((string) $admissionCounter, 4, '0', STR_PAD_LEFT),
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

                $relationship = ['mother', 'father', 'guardian'][array_rand(['mother', 'father', 'guardian'])];
                $guardian = Guardian::create([
                    'school_id' => $this->school->id,
                    'name' => $last.' Family',
                    'phone' => '0'.rand(700000000, 769999999),
                    'email' => strtolower($last).rand(1, 999).'@example.com',
                    'occupation' => ['Trader', 'Teacher', 'Nurse', 'Driver', 'Civil Servant'][array_rand(['Trader', 'Teacher', 'Nurse', 'Driver', 'Civil Servant'])],
                    'address' => 'Kinondoni, Dar es Salaam',
                ]);
                $guardian->students()->attach($student->id, [
                    'relationship' => $relationship,
                    'is_primary' => true,
                    'is_emergency_contact' => true,
                ]);

                $this->students[] = $student;
                $admissionCounter++;
            }
        }
    }

    protected function seedAdmissions(): void
    {
        foreach ([['Faith', 'Mwangosi', 'pending'], ['Grace', 'Sirili', 'under_review'], ['Editha', 'Materu', 'accepted']] as [$first, $last, $status]) {
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

        foreach ($this->classes as $class) {
            foreach (['English Language', 'Mathematics', 'Kiswahili'] as $subjectName) {
                $examSubject = $service->addSubject($exam, [
                    'school_class_id' => $class->id,
                    'subject_id' => $this->subjects[$subjectName]->id,
                    'max_marks' => 100,
                    'pass_marks' => 40,
                    'exam_date' => now()->subDays(8)->toDateString(),
                ]);

                foreach ($examSubject->results as $result) {
                    $service->recordMarks($result, (float) rand(38, 98), null, $this->staff['Agnes Shirima']->id);
                }
            }
        }

        $exam->update(['status' => 'published']);
    }

    protected function seedAnnouncements(): void
    {
        Announcement::create([
            'school_id' => $this->school->id,
            'title' => 'Welcome back for Term 2',
            'body' => 'Classes resume Monday 25th May. Please ensure fees are settled before reporting.',
            'audience' => 'school',
            'created_by' => $this->staff['Grace Mwakalinga']->id,
            'published_at' => now(),
        ]);
    }

    protected function seedFinance(): void
    {
        $categories = [
            'Tuition Fee' => 140000,
            'Lunch Fee' => 55000,
            'Transport Fee' => 35000,
            'Uniform Fee' => 40000,
            'Examination Fee' => 15000,
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
                        'amount' => round((float) $invoice->total_amount * 0.5, 2),
                        'method' => 'cash',
                        'paid_at' => now()->subDay()->toDateString(),
                    ], $receivedBy);
                }
            }
        }

        $expenseCategories = [];
        foreach (['Utilities', 'Maintenance', 'Teaching Materials'] as $name) {
            $expenseCategories[$name] = ExpenseCategory::create(['school_id' => $this->school->id, 'name' => $name]);
        }
        foreach ([['Utilities', 120000, 'Electricity bill'], ['Maintenance', 60000, 'Furniture repairs'], ['Teaching Materials', 75000, 'Exercise books and charts']] as [$catName, $amount, $desc]) {
            Expense::create([
                'school_id' => $this->school->id,
                'expense_category_id' => $expenseCategories[$catName]->id,
                'amount' => $amount,
                'description' => $desc,
                'expense_date' => now()->subDays(rand(1, 20))->toDateString(),
                'recorded_by' => $this->staff['Godfrey Urio']->id,
            ]);
        }
        foreach ($expenseCategories as $category) {
            Budget::create([
                'school_id' => $this->school->id,
                'expense_category_id' => $category->id,
                'academic_year_id' => $this->academicYear->id,
                'amount' => 1000000,
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
        foreach ([
            ['Oxford Junior English Dictionary', 'Oxford Press', 5],
            ['Primary Mathematics Workbook', 'TIE', 6],
            ['Kiswahili Kwanza', 'TATAKI', 5],
        ] as [$title, $author, $copies]) {
            Book::create([
                'school_id' => $this->school->id,
                'title' => $title,
                'author' => $author,
                'category' => 'Textbook',
                'total_copies' => $copies,
                'available_copies' => $copies,
            ]);
        }

        $routes = [];
        foreach (['Kinondoni Route', 'Mikocheni Route'] as $routeName) {
            $routes[] = TransportRoute::create([
                'school_id' => $this->school->id,
                'name' => $routeName,
                'driver_name' => 'Mzee '.explode(' ', $routeName)[0],
                'driver_phone' => '0'.rand(700000000, 769999999),
                'capacity' => 25,
            ]);
        }
        $transportService = app(TransportService::class);
        foreach (array_slice($this->students, 0, 15) as $i => $student) {
            $transportService->assign([
                'student_id' => $student->id,
                'transport_route_id' => $routes[$i % count($routes)]->id,
                'academic_year_id' => $this->academicYear->id,
                'pickup_point' => 'Stage '.($i + 1),
            ]);
        }
    }
}
