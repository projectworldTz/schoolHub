<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\Book;
use App\Models\CafeteriaMenu;
use App\Models\ClinicVisit;
use App\Models\Course;
use App\Models\Department;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubject;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\GradeBand;
use App\Models\GradingSystem;
use App\Models\Guardian;
use App\Models\Holiday;
use App\Models\Homework;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\Invoice;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Lesson;
use App\Models\Payment;
use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Models\Room;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Stream;
use App\Models\Student;
use App\Models\StaffContract;
use App\Models\StaffProfile;
use App\Models\StaffSalary;
use App\Models\Subject;
use App\Models\TimetableEntry;
use App\Models\TimetablePeriod;
use App\Models\TransportAssignment;
use App\Models\TransportRoute;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Fleshes out the demo school ("St Josephs Secondary") with realistic
 * volume across every module built in Phases 1-7, on top of whatever
 * sparse data already exists from ad-hoc curl/Playwright verification
 * during development. Intended to be run once against that school so
 * there's something worth clicking through in every part of the app —
 * not a fixture for automated tests (no factories were introduced; this
 * is a one-shot demo-content seeder, not reusable test scaffolding).
 */
class DemoDataSeeder extends Seeder
{
    protected School $school;

    protected AcademicYear $academicYear;

    protected string $termId;

    protected array $classes = [];

    protected array $streamsByClass = [];

    protected array $subjects = [];

    protected array $rooms = [];

    protected array $staffUsers = [];

    protected array $students = [];

    protected GradingSystem $gradingSystem;

    protected array $maleFirstNames = ['Juma', 'Hassan', 'Ibrahim', 'Musa', 'Ali', 'Rashid', 'Salim', 'Omari', 'Bakari', 'Hamisi', 'Said', 'Athumani', 'Iddi', 'Kassim', 'Yusuf', 'Abdallah', 'Ramadhani', 'Shabani', 'Hemed', 'Daniel', 'Peter', 'John', 'Joseph', 'Emmanuel'];

    protected array $femaleFirstNames = ['Amina', 'Fatuma', 'Halima', 'Zainab', 'Mwajuma', 'Rehema', 'Salma', 'Neema', 'Grace', 'Anna', 'Joyce', 'Mary', 'Elizabeth', 'Consolata', 'Happiness', 'Zuhura', 'Aisha', 'Mariam', 'Esther', 'Judith', 'Winnie', 'Agnes'];

    protected array $lastNames = ['Mwakalinga', 'Kileo', 'Mushi', 'Mbwana', 'Kimaro', 'Mnyika', 'Massawe', 'Chacha', 'Ndosi', 'Shirima', 'Temba', 'Mrema', 'Kessy', 'Lyimo', 'Ngowi', 'Sanga', 'Mollel', 'Kivuyo', 'Mgaya', 'Charles', 'Hassan', 'Juma', 'Mwenda', 'Nyerere'];

    protected int $emailCounter = 1;

    public function run(): void
    {
        $this->school = School::where('name', 'St Josephs Secondary')->firstOrFail();

        Tenant::runAsPlatform(fn () => Tenant::set($this->school->id));
        Tenant::set($this->school->id);

        $this->academicYear = AcademicYear::where('school_id', $this->school->id)->firstOrFail();
        $this->termId = \App\Models\Term::where('academic_year_id', $this->academicYear->id)
            ->where('is_current', true)->value('id')
            ?? \App\Models\Term::where('academic_year_id', $this->academicYear->id)->value('id');
        $this->gradingSystem = GradingSystem::where('school_id', $this->school->id)->where('is_default', true)->firstOrFail();

        $this->command?->info('Seeding academic structure...');
        $this->seedGradeBands();
        $this->seedDepartmentsAndSubjects();
        $this->seedRooms();
        $this->seedClassesAndStreams();
        $this->seedHolidays();

        $this->command?->info('Seeding staff...');
        $this->seedStaff();

        $this->command?->info('Seeding students, guardians, enrollments...');
        $this->seedStudents();

        $this->command?->info('Seeding admissions...');
        $this->seedAdmissions();

        $this->command?->info('Seeding attendance...');
        $this->seedAttendance();
        $this->seedStaffAttendance();

        $this->command?->info('Seeding timetable...');
        $this->seedTimetable();

        $this->command?->info('Seeding homework...');
        $this->seedHomework();

        $this->command?->info('Seeding announcements...');
        $this->seedAnnouncements();

        $this->command?->info('Seeding exams and results...');
        $this->seedExams();

        $this->command?->info('Seeding LMS courses...');
        $this->seedLms();

        $this->command?->info('Seeding finance (fees, invoices, payroll, expenses)...');
        $this->seedFinance();

        $this->command?->info('Seeding facilities (library, hostel, transport, inventory, clinic, cafeteria)...');
        $this->seedLibrary();
        $this->seedHostel();
        $this->seedTransport();
        $this->seedInventory();
        $this->seedClinic();
        $this->seedCafeteria();

        $this->command?->info('Demo data seed complete.');
    }

    protected function randomFullName(?string $gender = null): array
    {
        $gender ??= fake()->randomElement(['male', 'female']);
        $first = $gender === 'female'
            ? fake()->randomElement($this->femaleFirstNames)
            : fake()->randomElement($this->maleFirstNames);
        $last = fake()->randomElement($this->lastNames);

        return [$first, $last, $gender];
    }

    protected function uniqueEmail(string $first, string $last, string $domain): string
    {
        return strtolower($first).'.'.strtolower($last).($this->emailCounter++).'@'.$domain;
    }

    protected function seedGradeBands(): void
    {
        if ($this->gradingSystem->gradeBands()->count() >= 5) {
            return;
        }

        $this->gradingSystem->gradeBands()->delete();

        foreach ([
            ['label' => 'A', 'min_score' => 80, 'max_score' => 100, 'remark' => 'Excellent', 'gpa' => 5],
            ['label' => 'B', 'min_score' => 70, 'max_score' => 79, 'remark' => 'Very Good', 'gpa' => 4],
            ['label' => 'C', 'min_score' => 60, 'max_score' => 69, 'remark' => 'Good', 'gpa' => 3],
            ['label' => 'D', 'min_score' => 50, 'max_score' => 59, 'remark' => 'Satisfactory', 'gpa' => 2],
            ['label' => 'E', 'min_score' => 40, 'max_score' => 49, 'remark' => 'Pass', 'gpa' => 1],
            ['label' => 'F', 'min_score' => 0, 'max_score' => 39, 'remark' => 'Fail', 'gpa' => 0],
        ] as $band) {
            GradeBand::create([...$band, 'grading_system_id' => $this->gradingSystem->id]);
        }
    }

    protected function seedDepartmentsAndSubjects(): void
    {
        $departments = [
            'Sciences' => 'SCI',
            'Languages' => 'LANG',
            'Humanities' => 'HUM',
            'Administration' => 'ADM',
        ];

        $departmentIds = [];
        foreach ($departments as $name => $code) {
            $departmentIds[$name] = Department::firstOrCreate(
                ['school_id' => $this->school->id, 'name' => $name],
                ['code' => $code]
            )->id;
        }

        $subjects = [
            ['Mathematics', 'MATH', 'Sciences'],
            ['English', 'ENG', 'Languages'],
            ['Kiswahili', 'KISW', 'Languages'],
            ['Biology', 'BIO', 'Sciences'],
            ['Chemistry', 'CHEM', 'Sciences'],
            ['Physics', 'PHY', 'Sciences'],
            ['Geography', 'GEO', 'Humanities'],
            ['History', 'HIST', 'Humanities'],
            ['Civics', 'CIV', 'Humanities'],
            ['Computer Science', 'COMP', 'Sciences'],
        ];

        foreach ($subjects as [$name, $code, $dept]) {
            $this->subjects[$code] = Subject::firstOrCreate(
                ['school_id' => $this->school->id, 'code' => $code],
                ['name' => $name, 'department_id' => $departmentIds[$dept], 'is_active' => true]
            );
        }
    }

    protected function seedRooms(): void
    {
        $branchId = \App\Models\Branch::where('school_id', $this->school->id)->value('id');

        for ($i = 1; $i <= 6; $i++) {
            $this->rooms[] = Room::firstOrCreate(
                ['school_id' => $this->school->id, 'name' => "Classroom $i"],
                ['branch_id' => $branchId, 'capacity' => 40, 'type' => 'classroom']
            );
        }
    }

    protected function seedClassesAndStreams(): void
    {
        foreach ([1, 2, 3, 4] as $level) {
            $class = SchoolClass::firstOrCreate(
                ['school_id' => $this->school->id, 'name' => "Form $level"],
                ['level' => $level]
            );
            $this->classes[$level] = $class;

            $class->subjects()->syncWithoutDetaching(collect($this->subjects)->pluck('id')->all());

            $streams = [];
            foreach (['A', 'B'] as $letter) {
                $streams[] = Stream::firstOrCreate(
                    ['school_id' => $this->school->id, 'school_class_id' => $class->id, 'name' => "Form $level$letter"],
                    ['academic_year_id' => $this->academicYear->id, 'capacity' => 40, 'room_id' => fake()->randomElement($this->rooms)->id]
                );
            }
            $this->streamsByClass[$level] = $streams;
        }
    }

    protected function seedHolidays(): void
    {
        $holidays = [
            ['Mid-term Break', '2026-08-15', '2026-08-22', 'One week break between terms'],
            ['Independence Day', '2026-12-09', '2026-12-09', 'National holiday'],
            ['Christmas Break', '2026-12-20', '2027-01-05', 'End of year break'],
            ['Easter Break', '2027-03-26', '2027-04-02', 'Easter holiday'],
        ];

        foreach ($holidays as [$name, $start, $end, $desc]) {
            Holiday::firstOrCreate(
                ['school_id' => $this->school->id, 'name' => $name],
                ['academic_year_id' => $this->academicYear->id, 'start_date' => $start, 'end_date' => $end, 'description' => $desc]
            );
        }
    }

    protected function seedStaff(): void
    {
        if (User::where('school_id', $this->school->id)->count() >= 18) {
            $this->staffUsers = User::where('school_id', $this->school->id)
                ->whereHas('staffProfile')
                ->get()
                ->keyBy(fn ($u) => $u->staffProfile->job_title)
                ->all();

            return;
        }

        $roleSpecs = [
            ['role' => 'Vice Principal', 'title' => 'Vice Principal', 'dept' => 'Administration', 'salary' => 1800000],
            ['role' => 'Academic Master', 'title' => 'Academic Master', 'dept' => 'Administration', 'salary' => 1600000],
            ['role' => 'Registrar', 'title' => 'Registrar', 'dept' => 'Administration', 'salary' => 1200000],
            ['role' => 'Admissions Officer', 'title' => 'Admissions Officer', 'dept' => 'Administration', 'salary' => 1000000],
            ['role' => 'Accountant', 'title' => 'Accountant', 'dept' => 'Administration', 'salary' => 1300000],
            ['role' => 'Bursar', 'title' => 'Bursar', 'dept' => 'Administration', 'salary' => 1400000],
            ['role' => 'HR Officer', 'title' => 'HR Officer', 'dept' => 'Administration', 'salary' => 1100000],
            ['role' => 'Librarian', 'title' => 'Librarian', 'dept' => 'Administration', 'salary' => 900000],
            ['role' => 'Hostel Warden', 'title' => 'Hostel Warden', 'dept' => 'Administration', 'salary' => 850000],
            ['role' => 'Transport Officer', 'title' => 'Transport Officer', 'dept' => 'Administration', 'salary' => 800000],
            ['role' => 'Nurse', 'title' => 'School Nurse', 'dept' => 'Administration', 'salary' => 950000],
            ['role' => 'Receptionist', 'title' => 'Receptionist', 'dept' => 'Administration', 'salary' => 700000],
            ['role' => 'Store Keeper', 'title' => 'Store Keeper', 'dept' => 'Administration', 'salary' => 750000],
            ['role' => 'Security Officer', 'title' => 'Security Officer', 'dept' => 'Administration', 'salary' => 650000],
            ['role' => 'Teacher', 'title' => 'Biology Teacher', 'dept' => 'Sciences', 'salary' => 1100000, 'subject' => 'BIO'],
            ['role' => 'Teacher', 'title' => 'Chemistry Teacher', 'dept' => 'Sciences', 'salary' => 1100000, 'subject' => 'CHEM'],
            ['role' => 'Teacher', 'title' => 'Physics Teacher', 'dept' => 'Sciences', 'salary' => 1100000, 'subject' => 'PHY'],
            ['role' => 'Teacher', 'title' => 'Kiswahili Teacher', 'dept' => 'Languages', 'salary' => 1050000, 'subject' => 'KISW'],
            ['role' => 'Teacher', 'title' => 'English Teacher', 'dept' => 'Languages', 'salary' => 1050000, 'subject' => 'ENG'],
            ['role' => 'Teacher', 'title' => 'Geography Teacher', 'dept' => 'Humanities', 'salary' => 1000000, 'subject' => 'GEO'],
            ['role' => 'Teacher', 'title' => 'History Teacher', 'dept' => 'Humanities', 'salary' => 1000000, 'subject' => 'HIST'],
            ['role' => 'Class Teacher', 'title' => 'Computer Science Teacher', 'dept' => 'Sciences', 'salary' => 1100000, 'subject' => 'COMP'],
        ];

        $departmentIds = Department::where('school_id', $this->school->id)->pluck('id', 'name');
        $staffNumber = 100;

        foreach ($roleSpecs as $spec) {
            [$first, $last, ] = $this->randomFullName();
            $email = $this->uniqueEmail($first, $last, 'stjosephs.test');

            $user = User::create([
                'school_id' => $this->school->id,
                'name' => "$first $last",
                'email' => $email,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            $user->assignRole($spec['role']);

            $staffNumber++;
            $profile = StaffProfile::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'department_id' => $departmentIds[$spec['dept']] ?? null,
                'staff_number' => 'STF-'.$staffNumber,
                'job_title' => $spec['title'],
                'employment_type' => 'full_time',
                'hire_date' => now()->subYears(fake()->numberBetween(1, 6))->subDays(fake()->numberBetween(0, 300)),
            ]);

            if (isset($spec['subject'])) {
                $user->subjectsTaught()->syncWithoutDetaching([$this->subjects[$spec['subject']]->id]);
            }

            StaffContract::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'contract_type' => 'full_time',
                'start_date' => $profile->hire_date,
                'salary' => $spec['salary'],
            ]);

            StaffSalary::create([
                'school_id' => $this->school->id,
                'user_id' => $user->id,
                'basic_salary' => $spec['salary'],
                'allowances' => round($spec['salary'] * 0.1),
                'deductions' => round($spec['salary'] * 0.05),
                'effective_from' => $profile->hire_date,
            ]);

            $this->staffUsers[$spec['title']] = $user;
        }
    }

    protected function seedStudents(): void
    {
        if (Student::where('school_id', $this->school->id)->count() >= 40) {
            $this->students = Student::where('school_id', $this->school->id)->get()->all();

            return;
        }

        $bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', null, null];
        $admissionCounter = 2;

        foreach ([1, 2, 3, 4] as $level) {
            $streams = $this->streamsByClass[$level];

            for ($i = 0; $i < 9; $i++) {
                [$first, $last, $gender] = $this->randomFullName();
                $admissionCounter++;

                $student = Student::create([
                    'school_id' => $this->school->id,
                    'admission_number' => 'ADM-'.str_pad((string) $admissionCounter, 3, '0', STR_PAD_LEFT),
                    'first_name' => $first,
                    'last_name' => $last,
                    'date_of_birth' => now()->subYears(13 + $level)->subDays(fake()->numberBetween(0, 300)),
                    'gender' => $gender,
                    'blood_group' => fake()->randomElement($bloodGroups),
                    'emergency_contact_name' => fake()->name(),
                    'emergency_contact_phone' => '+2557'.fake()->numerify('########'),
                    'status' => 'active',
                ]);

                $stream = $streams[$i % 2];
                \App\Models\StudentEnrollment::create([
                    'school_id' => $this->school->id,
                    'student_id' => $student->id,
                    'academic_year_id' => $this->academicYear->id,
                    'school_class_id' => $this->classes[$level]->id,
                    'stream_id' => $stream->id,
                    'status' => 'active',
                    'enrolled_at' => $this->academicYear->start_date,
                ]);

                [$gFirst, $gLast] = $this->randomFullName();
                $guardian = Guardian::create([
                    'school_id' => $this->school->id,
                    'name' => "$gFirst $gLast",
                    'phone' => '+2557'.fake()->numerify('########'),
                    'occupation' => fake()->randomElement(['Business owner', 'Farmer', 'Teacher', 'Nurse', 'Driver', 'Trader', 'Civil servant', 'Engineer']),
                ]);
                $guardian->students()->attach($student->id, [
                    'relationship' => fake()->randomElement(['father', 'mother', 'guardian']),
                    'is_primary' => true,
                    'is_emergency_contact' => true,
                ]);

                $this->students[] = $student;
            }
        }
    }

    protected function seedAdmissions(): void
    {
        if (AdmissionApplication::where('school_id', $this->school->id)->count() >= 8) {
            return;
        }

        $statuses = ['pending', 'under_review', 'accepted', 'rejected', 'pending', 'under_review', 'accepted', 'rejected'];

        foreach ($statuses as $status) {
            [$first, $last, $gender] = $this->randomFullName();

            AdmissionApplication::create([
                'school_id' => $this->school->id,
                'academic_year_id' => $this->academicYear->id,
                'applying_for_class_id' => $this->classes[1]->id,
                'applicant_first_name' => $first,
                'applicant_last_name' => $last,
                'date_of_birth' => now()->subYears(14)->subDays(fake()->numberBetween(0, 300)),
                'gender' => $gender,
                'guardian_name' => fake()->name(),
                'guardian_phone' => '+2557'.fake()->numerify('########'),
                'guardian_email' => strtolower($first).'.parent'.($this->emailCounter++).'@example.test',
                'status' => $status,
            ]);
        }
    }

    protected function seedAttendance(): void
    {
        $enrollments = \App\Models\StudentEnrollment::where('school_id', $this->school->id)
            ->where('status', 'active')
            ->get();

        $rows = [];
        $date = now()->subDays(14);
        $daysSeeded = 0;

        while ($daysSeeded < 10) {
            $date->addDay();
            if ($date->isWeekend()) {
                continue;
            }
            $daysSeeded++;

            foreach ($enrollments as $enrollment) {
                $status = fake()->randomElement(['present', 'present', 'present', 'present', 'present', 'absent', 'late', 'excused']);

                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'school_id' => $this->school->id,
                    'student_id' => $enrollment->student_id,
                    'school_class_id' => $enrollment->school_class_id,
                    'stream_id' => $enrollment->stream_id,
                    'academic_year_id' => $enrollment->academic_year_id,
                    'date' => $date->toDateString(),
                    'status' => $status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            \DB::table('attendance_records')->insertOrIgnore($chunk);
        }
    }

    protected function seedStaffAttendance(): void
    {
        $staffIds = \App\Models\User::where('school_id', $this->school->id)
            ->whereHas('staffProfile')
            ->where('is_active', true)
            ->pluck('id');

        $rows = [];
        $date = now()->subDays(14);
        $daysSeeded = 0;

        while ($daysSeeded < 10) {
            $date->addDay();
            if ($date->isWeekend()) {
                continue;
            }
            $daysSeeded++;

            foreach ($staffIds as $userId) {
                $status = fake()->randomElement(['present', 'present', 'present', 'present', 'present', 'present', 'absent', 'late', 'on_leave']);

                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'school_id' => $this->school->id,
                    'user_id' => $userId,
                    'date' => $date->toDateString(),
                    'status' => $status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            \DB::table('staff_attendance_records')->insertOrIgnore($chunk);
        }
    }

    protected function seedTimetable(): void
    {
        if (TimetablePeriod::where('school_id', $this->school->id)->count() < 6) {
            $times = [
                ['08:00', '08:40'], ['08:40', '09:20'], ['09:20', '10:00'],
                ['10:20', '11:00'], ['11:00', '11:40'], ['11:40', '12:20'],
            ];
            foreach ($times as $i => [$start, $end]) {
                TimetablePeriod::firstOrCreate(
                    ['school_id' => $this->school->id, 'name' => 'Period '.($i + 1)],
                    ['start_time' => $start, 'end_time' => $end, 'sort_order' => $i + 1, 'is_break' => false]
                );
            }
        }

        if (TimetableEntry::where('school_id', $this->school->id)->count() >= 20) {
            return;
        }

        $periods = TimetablePeriod::where('school_id', $this->school->id)->orderBy('sort_order')->get();
        $teacherIds = collect($this->staffUsers)->filter(fn ($u) => $u->hasRole('Teacher') || $u->hasRole('Class Teacher'))->values();
        $subjectIds = array_values($this->subjects);

        foreach ([1, 2] as $level) {
            foreach ($this->streamsByClass[$level] as $stream) {
                foreach (range(1, 5) as $dayOfWeek) {
                    foreach ($periods->take(4) as $period) {
                        TimetableEntry::firstOrCreate([
                            'school_id' => $this->school->id,
                            'school_class_id' => $this->classes[$level]->id,
                            'stream_id' => $stream->id,
                            'timetable_period_id' => $period->id,
                            'day_of_week' => $dayOfWeek,
                        ], [
                            'subject_id' => fake()->randomElement($subjectIds)->id,
                            'teacher_id' => $teacherIds->isNotEmpty() ? fake()->randomElement($teacherIds->all())->id : null,
                            'room_id' => fake()->randomElement($this->rooms)->id,
                            'academic_year_id' => $this->academicYear->id,
                        ]);
                    }
                }
            }
        }
    }

    protected function seedHomework(): void
    {
        if (Homework::where('school_id', $this->school->id)->count() >= 10) {
            return;
        }

        $teacherIds = collect($this->staffUsers)->filter(fn ($u) => $u->hasRole('Teacher') || $u->hasRole('Class Teacher'))->values();
        $titles = [
            'Algebra practice set', 'Essay on independence heroes', 'Cell structure worksheet',
            'Periodic table quiz prep', 'Newton\'s laws problems', 'Kiswahili insha',
            'Map reading exercise', 'World War II timeline', 'Civics group project', 'Python basics exercise',
        ];

        foreach (array_slice($titles, 0, 10) as $i => $title) {
            $level = ($i % 4) + 1;
            $subject = fake()->randomElement(array_values($this->subjects));

            $homework = Homework::create([
                'school_id' => $this->school->id,
                'school_class_id' => $this->classes[$level]->id,
                'subject_id' => $subject->id,
                'teacher_id' => $teacherIds->isNotEmpty() ? fake()->randomElement($teacherIds->all())->id : null,
                'academic_year_id' => $this->academicYear->id,
                'title' => $title,
                'description' => 'Complete the assigned exercises and submit before the due date.',
                'due_date' => now()->addDays(fake()->numberBetween(-5, 10)),
            ]);

            $classStudentIds = \App\Models\StudentEnrollment::where('school_class_id', $this->classes[$level]->id)
                ->where('status', 'active')->pluck('student_id');

            foreach ($classStudentIds as $studentId) {
                $status = fake()->randomElement(['pending', 'submitted', 'graded', 'graded']);
                \App\Models\HomeworkSubmission::create([
                    'school_id' => $this->school->id,
                    'homework_id' => $homework->id,
                    'student_id' => $studentId,
                    'status' => $status,
                    'submitted_at' => $status === 'pending' ? null : now()->subDays(fake()->numberBetween(0, 4)),
                    'grade' => $status === 'graded' ? fake()->numberBetween(50, 100) : null,
                    'feedback' => $status === 'graded' ? fake()->randomElement(['Good work!', 'Well done.', 'Needs improvement.', 'Excellent effort.']) : null,
                ]);
            }
        }
    }

    protected function seedAnnouncements(): void
    {
        if (Announcement::where('school_id', $this->school->id)->count() >= 8) {
            return;
        }

        $creatorId = collect($this->staffUsers)->first()?->id;
        $announcements = [
            ['School Reopening', 'School reopens on Monday for Term 2. Please ensure fees are settled.', 'school', null, null],
            ['Parents Meeting', 'A parents meeting will be held this Saturday at 10am in the main hall.', 'school', null, null],
            ['Form 1 Orientation', 'Form 1 students should report by 7:30am for orientation.', 'class', 1, null],
            ['Form 4 Mock Exam Timetable', 'Mock exam timetable has been posted on the notice board.', 'class', 4, null],
            ['Teachers Briefing', 'All teaching staff should attend the briefing after assembly.', 'role', null, 'Teacher'],
            ['Library Extended Hours', 'The library will be open until 6pm during exam week.', 'school', null, null],
            ['Sports Day', 'Annual sports day is scheduled for next Friday.', 'school', null, null],
            ['Fee Deadline Reminder', 'Term 2 fees are due by the end of this month.', 'role', null, 'Parent'],
        ];

        foreach ($announcements as [$title, $body, $audience, $level, $role]) {
            Announcement::create([
                'school_id' => $this->school->id,
                'title' => $title,
                'body' => $body,
                'audience' => $audience,
                'school_class_id' => $level ? $this->classes[$level]->id : null,
                'role' => $role,
                'created_by' => $creatorId,
                'published_at' => now()->subDays(fake()->numberBetween(0, 20)),
            ]);
        }
    }

    protected function seedExams(): void
    {
        $existingExams = Exam::where('school_id', $this->school->id)->count();
        if ($existingExams >= 3) {
            return;
        }

        $examDefs = [
            ['name' => 'End of Term 1 Exam', 'type' => 'final'],
            ['name' => 'Mid-Term 2 Exam', 'type' => 'midterm'],
        ];

        foreach ($examDefs as $def) {
            $exam = Exam::create([
                'school_id' => $this->school->id,
                'academic_year_id' => $this->academicYear->id,
                'term_id' => $this->termId,
                'name' => $def['name'],
                'exam_type' => $def['type'],
                'start_date' => now()->subDays(fake()->numberBetween(5, 30)),
                'end_date' => now()->subDays(fake()->numberBetween(1, 4)),
                'status' => 'completed',
            ]);

            foreach ([1, 2] as $level) {
                $examSubjects = [];
                foreach (array_slice(array_values($this->subjects), 0, 5) as $subject) {
                    $examSubjects[] = ExamSubject::create([
                        'school_id' => $this->school->id,
                        'exam_id' => $exam->id,
                        'school_class_id' => $this->classes[$level]->id,
                        'subject_id' => $subject->id,
                        'max_marks' => 100,
                        'pass_marks' => 40,
                        'exam_date' => $exam->start_date,
                    ]);
                }

                $classStudentIds = \App\Models\StudentEnrollment::where('school_class_id', $this->classes[$level]->id)
                    ->where('status', 'active')->pluck('student_id');

                foreach ($examSubjects as $examSubject) {
                    foreach ($classStudentIds as $studentId) {
                        $marks = fake()->numberBetween(25, 98);
                        $grade = $this->gradeFor($marks);

                        ExamResult::create([
                            'school_id' => $this->school->id,
                            'exam_subject_id' => $examSubject->id,
                            'student_id' => $studentId,
                            'marks_obtained' => $marks,
                            'grade' => $grade,
                        ]);
                    }
                }
            }
        }
    }

    protected function gradeFor(float $marks): ?string
    {
        $band = $this->gradingSystem->gradeBands()
            ->where('min_score', '<=', $marks)
            ->where('max_score', '>=', $marks)
            ->first();

        return $band?->label;
    }

    protected function seedLms(): void
    {
        if (Course::where('school_id', $this->school->id)->count() >= 5) {
            return;
        }

        $teacherIds = collect($this->staffUsers)->filter(fn ($u) => $u->hasRole('Teacher') || $u->hasRole('Class Teacher'))->values();
        $courseDefs = [
            ['MATH', 'Algebra Foundations', 1],
            ['BIO', 'Introduction to Cell Biology', 2],
            ['CHEM', 'Periodic Table Essentials', 2],
            ['ENG', 'Essay Writing Skills', 1],
            ['COMP', 'Python for Beginners', 3],
        ];

        foreach ($courseDefs as [$code, $title, $level]) {
            $course = Course::create([
                'school_id' => $this->school->id,
                'subject_id' => $this->subjects[$code]->id,
                'school_class_id' => $this->classes[$level]->id,
                'teacher_id' => $teacherIds->isNotEmpty() ? fake()->randomElement($teacherIds->all())->id : null,
                'title' => $title,
                'description' => "Course content for $title.",
                'is_published' => true,
            ]);

            foreach (range(1, 3) as $i) {
                Lesson::create([
                    'school_id' => $this->school->id,
                    'course_id' => $course->id,
                    'title' => "Lesson $i",
                    'content' => "Content for lesson $i of $title.",
                    'sort_order' => $i,
                ]);
            }
        }
    }

    protected function seedFinance(): void
    {
        $feeCategories = [];
        foreach (['Tuition', 'Transport', 'Boarding', 'Exam Fee', 'Uniform'] as $name) {
            $feeCategories[$name] = FeeCategory::firstOrCreate(
                ['school_id' => $this->school->id, 'name' => $name]
            );
        }

        $feeStructures = [];
        foreach ([1, 2, 3, 4] as $level) {
            foreach (['Tuition' => 400000, 'Exam Fee' => 30000] as $catName => $amount) {
                $feeStructures[$level][] = FeeStructure::firstOrCreate([
                    'school_id' => $this->school->id,
                    'academic_year_id' => $this->academicYear->id,
                    'school_class_id' => $this->classes[$level]->id,
                    'fee_category_id' => $feeCategories[$catName]->id,
                ], [
                    'term_id' => $this->termId,
                    'amount' => $amount,
                    'due_date' => now()->addDays(30),
                ]);
            }
        }

        if (Invoice::where('school_id', $this->school->id)->count() < 30) {
            $receivedBy = collect($this->staffUsers)->first(fn ($u) => $u->hasRole('Bursar')) ?? collect($this->staffUsers)->first();

            foreach ([1, 2, 3, 4] as $level) {
                $classStudentIds = \App\Models\StudentEnrollment::where('school_class_id', $this->classes[$level]->id)
                    ->where('status', 'active')->pluck('student_id');
                $structures = $feeStructures[$level];
                $total = collect($structures)->sum('amount');

                foreach ($classStudentIds as $studentId) {
                    if (Invoice::where('student_id', $studentId)->where('academic_year_id', $this->academicYear->id)->exists()) {
                        continue;
                    }

                    $invoice = Invoice::create([
                        'school_id' => $this->school->id,
                        'student_id' => $studentId,
                        'academic_year_id' => $this->academicYear->id,
                        'term_id' => $this->termId,
                        'invoice_number' => 'INV-'.now()->format('y').'-'.strtoupper(Str::random(6)),
                        'total_amount' => $total,
                        'due_date' => now()->addDays(30),
                    ]);

                    foreach ($structures as $structure) {
                        \App\Models\InvoiceItem::create([
                            'invoice_id' => $invoice->id,
                            'fee_structure_id' => $structure->id,
                            'description' => $structure->feeCategory->name,
                            'amount' => $structure->amount,
                        ]);
                    }

                    $paymentOutcome = fake()->randomElement(['paid', 'paid', 'partial', 'partial', 'none']);
                    $amountPaid = match ($paymentOutcome) {
                        'paid' => $total,
                        'partial' => round($total * fake()->randomFloat(2, 0.3, 0.7)),
                        default => 0,
                    };

                    if ($amountPaid > 0) {
                        Payment::create([
                            'school_id' => $this->school->id,
                            'invoice_id' => $invoice->id,
                            'student_id' => $studentId,
                            'amount' => $amountPaid,
                            'method' => fake()->randomElement(['cash', 'bank_transfer', 'mobile_money']),
                            'provider' => fake()->randomElement([null, 'M-Pesa', 'Tigo Pesa', 'Airtel Money']),
                            'paid_at' => now()->subDays(fake()->numberBetween(0, 25)),
                            'received_by' => $receivedBy?->id,
                        ]);

                        $invoice->amount_paid = $amountPaid;
                        $invoice->status = $paymentOutcome === 'paid' ? 'paid' : 'partial';
                        $invoice->save();
                    }
                }
            }
        }

        $payrollRun = PayrollRun::firstOrCreate([
            'school_id' => $this->school->id,
            'month' => (int) now()->subMonth()->format('n'),
            'year' => (int) now()->subMonth()->format('Y'),
        ], [
            'status' => 'processed',
            'processed_at' => now()->subDays(3),
        ]);

        $staffWithPayslip = Payslip::where('payroll_run_id', $payrollRun->id)->pluck('user_id')->all();

        foreach (StaffSalary::where('school_id', $this->school->id)->get() as $salary) {
            if (in_array($salary->user_id, $staffWithPayslip, true)) {
                continue;
            }

            $net = bcadd((string) $salary->basic_salary, bcsub((string) $salary->allowances, (string) $salary->deductions, 2), 2);

            Payslip::create([
                'school_id' => $this->school->id,
                'payroll_run_id' => $payrollRun->id,
                'user_id' => $salary->user_id,
                'basic_salary' => $salary->basic_salary,
                'allowances' => $salary->allowances,
                'deductions' => $salary->deductions,
                'net_salary' => $net,
                'status' => 'paid',
                'paid_at' => now()->subDays(2),
            ]);
        }

        $expenseCategories = [];
        foreach (['Utilities', 'Maintenance', 'Supplies', 'Fuel', 'Marketing'] as $name) {
            $expenseCategories[$name] = ExpenseCategory::firstOrCreate(['school_id' => $this->school->id, 'name' => $name]);
        }

        if (Expense::where('school_id', $this->school->id)->count() < 12) {
            $recordedBy = collect($this->staffUsers)->first(fn ($u) => $u->hasRole('Accountant')) ?? collect($this->staffUsers)->first();

            foreach (range(1, 12) as $i) {
                Expense::create([
                    'school_id' => $this->school->id,
                    'expense_category_id' => fake()->randomElement($expenseCategories)->id,
                    'amount' => fake()->numberBetween(50000, 900000),
                    'description' => fake()->randomElement(['Electricity bill', 'Water bill', 'Classroom repairs', 'Stationery purchase', 'Fuel for school bus', 'Printing services', 'Cleaning supplies', 'Generator maintenance']),
                    'expense_date' => now()->subDays(fake()->numberBetween(0, 60)),
                    'recorded_by' => $recordedBy?->id,
                ]);
            }
        }

        $budgetAmounts = [
            'Utilities' => 1200000,
            'Maintenance' => 1500000,
            'Supplies' => 900000,
            'Fuel' => 600000,
            'Marketing' => 400000,
        ];
        foreach ($budgetAmounts as $name => $amount) {
            \App\Models\Budget::firstOrCreate([
                'school_id' => $this->school->id,
                'expense_category_id' => $expenseCategories[$name]->id,
                'academic_year_id' => $this->academicYear->id,
            ], [
                'amount' => $amount,
            ]);
        }
    }

    protected function seedLibrary(): void
    {
        if (Book::where('school_id', $this->school->id)->count() >= 15) {
            return;
        }

        $books = [
            ['Things Fall Apart', 'Chinua Achebe', 'Fiction'],
            ['A Grain of Wheat', 'Ngugi wa Thiong\'o', 'Fiction'],
            ['NECTA Mathematics Revision', 'Ministry of Education', 'Textbook'],
            ['Physics for East Africa', 'J. Mwangi', 'Textbook'],
            ['Chemistry Made Simple', 'A. Kessy', 'Textbook'],
            ['Biology Today', 'P. Mrema', 'Textbook'],
            ['English Grammar in Use', 'Raymond Murphy', 'Reference'],
            ['Kamusi ya Kiswahili', 'TUKI', 'Reference'],
            ['History of East Africa', 'B. Ogot', 'Textbook'],
            ['Geography of Tanzania', 'C. Sanga', 'Textbook'],
            ['Introduction to Computer Science', 'D. Lyimo', 'Textbook'],
            ['Civics and Citizenship', 'E. Ndosi', 'Textbook'],
            ['The River Between', 'Ngugi wa Thiong\'o', 'Fiction'],
            ['Long Walk to Freedom', 'Nelson Mandela', 'Biography'],
            ['Half of a Yellow Sun', 'Chimamanda Ngozi Adichie', 'Fiction'],
        ];

        $createdBooks = [];
        foreach ($books as [$title, $author, $category]) {
            $copies = fake()->numberBetween(2, 6);
            $createdBooks[] = Book::create([
                'school_id' => $this->school->id,
                'title' => $title,
                'author' => $author,
                'category' => $category,
                'total_copies' => $copies,
                'available_copies' => $copies,
            ]);
        }

        foreach (range(1, 12) as $i) {
            $book = fake()->randomElement($createdBooks);
            if ($book->available_copies < 1) {
                continue;
            }

            $returned = fake()->boolean(60);
            $book->decrement('available_copies');

            $loan = \App\Models\BookLoan::create([
                'school_id' => $this->school->id,
                'book_id' => $book->id,
                'student_id' => fake()->randomElement($this->students)->id,
                'borrowed_at' => now()->subDays(fake()->numberBetween(5, 30)),
                'due_date' => now()->subDays(fake()->numberBetween(-10, 15)),
                'status' => $returned ? 'returned' : 'borrowed',
            ]);

            if ($returned) {
                $loan->update(['returned_at' => now()->subDays(fake()->numberBetween(0, 5))]);
                $book->increment('available_copies');
            }
        }
    }

    protected function seedHostel(): void
    {
        if (HostelRoom::where('school_id', $this->school->id)->count() >= 6) {
            return;
        }

        $rooms = [];
        foreach (range(1, 3) as $i) {
            $rooms[] = HostelRoom::create(['school_id' => $this->school->id, 'name' => "Boys Dorm $i", 'type' => 'boys', 'capacity' => 6]);
        }
        foreach (range(1, 3) as $i) {
            $rooms[] = HostelRoom::create(['school_id' => $this->school->id, 'name' => "Girls Dorm $i", 'type' => 'girls', 'capacity' => 6]);
        }

        $boarders = collect($this->students)->random(min(15, count($this->students)));
        foreach ($boarders as $student) {
            $room = fake()->randomElement($rooms);
            if ($room->activeAllocations()->count() >= $room->capacity) {
                continue;
            }

            HostelAllocation::create([
                'school_id' => $this->school->id,
                'student_id' => $student->id,
                'hostel_room_id' => $room->id,
                'academic_year_id' => $this->academicYear->id,
                'allocated_at' => $this->academicYear->start_date,
                'status' => 'active',
            ]);
        }
    }

    protected function seedTransport(): void
    {
        if (TransportRoute::where('school_id', $this->school->id)->count() >= 4) {
            return;
        }

        $routes = [
            ['Route A - City Centre', 'T123 ABC', 'Mzee Juma', 30],
            ['Route B - Kariakoo', 'T456 DEF', 'Mzee Bakari', 25],
            ['Route C - Mikocheni', 'T789 GHI', 'Mzee Rashid', 25],
            ['Route D - Mbezi', 'T321 JKL', 'Mzee Omari', 30],
        ];

        $createdRoutes = [];
        foreach ($routes as [$name, $reg, $driver, $capacity]) {
            $createdRoutes[] = TransportRoute::create([
                'school_id' => $this->school->id,
                'name' => $name,
                'vehicle_registration' => $reg,
                'driver_name' => $driver,
                'driver_phone' => '+2557'.fake()->numerify('########'),
                'capacity' => $capacity,
            ]);
        }

        $riders = collect($this->students)->random(min(20, count($this->students)));
        foreach ($riders as $student) {
            $route = fake()->randomElement($createdRoutes);
            if ($route->activeAssignments()->count() >= $route->capacity) {
                continue;
            }

            TransportAssignment::create([
                'school_id' => $this->school->id,
                'student_id' => $student->id,
                'transport_route_id' => $route->id,
                'academic_year_id' => $this->academicYear->id,
                'pickup_point' => fake()->streetName(),
                'status' => 'active',
            ]);
        }
    }

    protected function seedInventory(): void
    {
        if (InventoryItem::where('school_id', $this->school->id)->count() >= 10) {
            return;
        }

        $items = [
            ['A4 Paper Reams', 'Stationery', 'ream', 50, 15],
            ['Whiteboard Markers', 'Stationery', 'box', 30, 10],
            ['Chalk Boxes', 'Stationery', 'box', 40, 10],
            ['Exercise Books', 'Stationery', 'dozen', 100, 20],
            ['First Aid Kits', 'Medical', 'kit', 10, 3],
            ['Cleaning Detergent', 'Cleaning', 'litre', 25, 5],
            ['Football Sets', 'Sports', 'set', 8, 2],
            ['Laboratory Beakers', 'Science', 'piece', 60, 15],
            ['Printer Toner', 'IT', 'cartridge', 12, 4],
            ['Desks and Chairs', 'Furniture', 'set', 200, 30],
        ];

        $recordedBy = collect($this->staffUsers)->first(fn ($u) => $u->hasRole('Store Keeper')) ?? collect($this->staffUsers)->first();

        foreach ($items as [$name, $category, $unit, $qty, $reorder]) {
            $item = InventoryItem::create([
                'school_id' => $this->school->id,
                'name' => $name,
                'category' => $category,
                'unit' => $unit,
                'quantity' => $qty,
                'reorder_level' => $reorder,
            ]);

            foreach (range(1, 2) as $i) {
                $type = fake()->randomElement(['in', 'out']);
                $moveQty = fake()->numberBetween(1, 10);

                InventoryTransaction::create([
                    'school_id' => $this->school->id,
                    'inventory_item_id' => $item->id,
                    'type' => $type,
                    'quantity' => $moveQty,
                    'reason' => $type === 'in' ? 'Restock' : 'Classroom distribution',
                    'recorded_by' => $recordedBy?->id,
                    'transaction_date' => now()->subDays(fake()->numberBetween(1, 30)),
                ]);
            }
        }
    }

    protected function seedClinic(): void
    {
        if (ClinicVisit::where('school_id', $this->school->id)->count() >= 10) {
            return;
        }

        $reasons = [
            ['Headache', 'Tension headache', 'Paracetamol and rest'],
            ['Stomach ache', 'Mild indigestion', 'Antacid given'],
            ['Fever', 'Common cold', 'Rest and fluids recommended'],
            ['Minor cut', 'Playground injury', 'Wound cleaned and dressed'],
            ['Malaria symptoms', 'Suspected malaria', 'Referred to hospital for testing'],
            ['Allergic reaction', 'Mild skin rash', 'Antihistamine given'],
            ['Toothache', 'Dental pain', 'Referred to dentist'],
            ['Sprained ankle', 'Sports injury', 'Ice pack and rest'],
            ['Dizziness', 'Low blood sugar', 'Given a snack, monitored'],
            ['Eye irritation', 'Dust exposure', 'Eyes rinsed, given eye drops'],
        ];

        $recordedBy = collect($this->staffUsers)->first(fn ($u) => $u->hasRole('Nurse')) ?? collect($this->staffUsers)->first();

        foreach ($reasons as [$reason, $diagnosis, $treatment]) {
            ClinicVisit::create([
                'school_id' => $this->school->id,
                'student_id' => fake()->randomElement($this->students)->id,
                'visit_date' => now()->subDays(fake()->numberBetween(0, 30)),
                'reason' => $reason,
                'diagnosis' => $diagnosis,
                'treatment' => $treatment,
                'recorded_by' => $recordedBy?->id,
            ]);
        }
    }

    protected function seedCafeteria(): void
    {
        if (CafeteriaMenu::where('school_id', $this->school->id)->count() >= 14) {
            return;
        }

        $lunches = ['Rice and beans', 'Ugali and greens', 'Pilau with chicken', 'Chapati and lentils', 'Fish and rice', 'Beef stew and rice', 'Vegetable curry and ugali'];
        $breakfasts = ['Porridge and mandazi', 'Bread and tea', 'Chapati and tea', 'Boiled eggs and toast', 'Uji and groundnuts', 'Sweet potatoes and tea', 'Bananas and milk'];

        for ($i = 0; $i < 7; $i++) {
            $date = now()->addDays($i)->toDateString();

            CafeteriaMenu::firstOrCreate(
                ['school_id' => $this->school->id, 'menu_date' => $date, 'meal_type' => 'breakfast'],
                ['description' => $breakfasts[$i]]
            );
            CafeteriaMenu::firstOrCreate(
                ['school_id' => $this->school->id, 'menu_date' => $date, 'meal_type' => 'lunch'],
                ['description' => $lunches[$i]]
            );
        }
    }
}
