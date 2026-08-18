<?php

namespace App\Services\School;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Term;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Bulk student onboarding AND re-import from a CSV export of whatever a
 * school already uses (a spreadsheet, another system's export) — the
 * single biggest gap in bringing a new school onto the platform, which
 * otherwise means typing every student in one at a time via
 * StudentController. Also doubles as the correction path when an earlier
 * import's file was missing/wrong data (e.g. class): re-uploading with the
 * same admission numbers updates those students in place rather than
 * rejecting them as duplicates.
 *
 * Same "preview, then confirm" shape as a real import tool: process()
 * always validates and reports every row; $commit just controls whether
 * valid rows are actually persisted. That means preview and commit can
 * never disagree about which rows are valid — there's only one code path.
 * A bad row never blocks the rest of the file — each row is independent.
 */
class StudentImportService
{
    protected const REQUIRED_HEADERS = ['admission_number', 'first_name', 'last_name'];

    public function process(UploadedFile $file, bool $commit): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = $this->normalizeHeader(fgetcsv($handle) ?: []);

        $missingHeaders = array_values(array_diff(self::REQUIRED_HEADERS, $header));
        if (! empty($missingHeaders)) {
            fclose($handle);

            return [
                'total_rows' => 0,
                'created_count' => 0,
                'updated_count' => 0,
                'class_assigned_count' => 0,
                'enrollment_year_calculated_count' => 0,
                'error_count' => 0,
                'committed' => false,
                'missing_headers' => $missingHeaders,
                'rows' => [],
            ];
        }

        // Resolved once per file, not per row: which classes exist (matched
        // case/whitespace-tolerantly), the school's current academic year,
        // and the lowest configured class level (the baseline "just
        // enrolled this year" grade used to calculate every other class's
        // Enrollment Year relative to it).
        $classesByNormalizedName = SchoolClass::all()->keyBy(fn (SchoolClass $c) => $this->normalizeClassName($c->name));
        $academicYear = $this->resolveCurrentAcademicYear();
        $minLevel = SchoolClass::min('level');

        $seenAdmissionNumbers = [];
        $rows = [];
        $rowNumber = 1;
        $createdCount = 0;
        $updatedCount = 0;
        $errorCount = 0;
        $classAssignedCount = 0;
        $enrollmentYearCalculatedCount = 0;

        // No wrapping transaction on purpose: rows are independent by
        // design (one bad row must never block the rest of the file), and
        // when $commit is false processRow() returns before touching the
        // database at all — there is nothing to roll back in preview mode.
        while (($line = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if (count(array_filter($line, fn ($v) => $v !== null && $v !== '')) === 0) {
                continue; // skip blank lines
            }

            $data = array_combine($header, array_pad($line, count($header), null));
            $data = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $data);

            $row = $this->processRow($data, $rowNumber, $commit, $seenAdmissionNumbers, $academicYear, $minLevel, $classesByNormalizedName);

            if ($row['status'] === 'error') {
                $errorCount++;
            } elseif (in_array($row['status'], ['created', 'would_create'], true)) {
                $createdCount++;
            } elseif (in_array($row['status'], ['updated', 'would_update'], true)) {
                $updatedCount++;
            }
            if (! empty($row['_class_assigned'])) {
                $classAssignedCount++;
            }
            if (! empty($row['_enrollment_year_calculated'])) {
                $enrollmentYearCalculatedCount++;
            }
            unset($row['_class_assigned'], $row['_enrollment_year_calculated']);

            $rows[] = $row;
        }

        fclose($handle);

        return [
            'total_rows' => count($rows),
            'created_count' => $createdCount,
            'updated_count' => $updatedCount,
            'class_assigned_count' => $classAssignedCount,
            'enrollment_year_calculated_count' => $enrollmentYearCalculatedCount,
            'error_count' => $errorCount,
            'committed' => $commit,
            'missing_headers' => [],
            'rows' => $rows,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<string, SchoolClass>  $classesByNormalizedName
     */
    protected function processRow(
        array $data,
        int $rowNumber,
        bool $commit,
        array &$seenAdmissionNumbers,
        ?AcademicYear $academicYear,
        ?int $minLevel,
        $classesByNormalizedName
    ): array {
        $admissionNumber = $data['admission_number'] ?? '';
        $firstName = $data['first_name'] ?? '';
        $lastName = $data['last_name'] ?? '';
        $errors = [];

        if ($admissionNumber === '') {
            $errors[] = 'Admission number is required.';
        }
        if ($firstName === '') {
            $errors[] = 'First name is required.';
        }
        if ($lastName === '') {
            $errors[] = 'Last name is required.';
        }

        // An admission number already in this school is no longer an error
        // — it means "update that student" instead of "create a new one".
        // Only a *repeat* within this same file is still rejected, since
        // there's no way to know which of the two rows should win.
        $existingStudent = null;
        if ($admissionNumber !== '') {
            if (in_array($admissionNumber, $seenAdmissionNumbers, true)) {
                $errors[] = "Duplicate admission number '{$admissionNumber}' earlier in this file.";
            } else {
                $existingStudent = Student::where('admission_number', $admissionNumber)->first();
            }
        }

        $result = [
            'row' => $rowNumber,
            'admission_number' => $admissionNumber,
            'name' => trim("{$firstName} {$lastName}"),
            'status' => 'error',
            'errors' => $errors,
            'warnings' => [],
        ];

        if (! empty($errors)) {
            return $result;
        }

        $seenAdmissionNumbers[] = $admissionNumber;
        $isUpdate = $existingStudent !== null;

        $rawClassName = $data['class_name'] ?? '';
        $schoolClass = null;
        if ($rawClassName !== '') {
            $schoolClass = $classesByNormalizedName->get($this->normalizeClassName($rawClassName));
            if (! $schoolClass) {
                $result['warnings'][] = "Class '{$rawClassName}' not found — student created without enrollment.";
            }
        }

        // Resolved up front (before the preview-mode early return below) so
        // preview reports the same warnings a real commit would produce —
        // e.g. an implausible year doesn't get silently saved just because
        // nobody previewed first.
        $enrollmentYear = null;
        if ($schoolClass && $academicYear && $minLevel !== null) {
            $enrollmentYear = $academicYear->start_date->year - ($schoolClass->level - $minLevel);

            $dob = ! empty($data['date_of_birth']) ? $data['date_of_birth'] : null;
            if ($dob && $enrollmentYear < Carbon::parse($dob)->year) {
                $result['warnings'][] = "Calculated enrollment year ({$enrollmentYear}) is before the student's date of birth — check class levels in Academic Setup.";
                $enrollmentYear = null;
            }
        }

        $result['status'] = $isUpdate
            ? ($commit ? 'updated' : 'would_update')
            : ($commit ? 'created' : 'would_create');
        $result['_class_assigned'] = $schoolClass !== null && $academicYear !== null;
        $result['_enrollment_year_calculated'] = $enrollmentYear !== null;

        if (! $commit) {
            return $result;
        }

        $student = DB::transaction(function () use (
            $existingStudent, $isUpdate, $admissionNumber, $firstName, $lastName, $data,
            $schoolClass, $academicYear, $enrollmentYear, &$result
        ) {
            if ($isUpdate) {
                $updates = [];
                if ($firstName !== '') {
                    $updates['first_name'] = $firstName;
                }
                if ($lastName !== '') {
                    $updates['last_name'] = $lastName;
                }
                if (! empty($data['date_of_birth'])) {
                    $updates['date_of_birth'] = $data['date_of_birth'];
                }
                if (! empty($data['gender'])) {
                    $updates['gender'] = $data['gender'];
                }
                if (! empty($updates)) {
                    $existingStudent->update($updates);
                }
                $student = $existingStudent;
            } else {
                $student = Student::create([
                    'admission_number' => $admissionNumber,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    // empty() (not ?:) is deliberate: it's null-safe for a key
                    // that's absent entirely (an optional column the CSV never
                    // had) as well as one that's present but blank.
                    'date_of_birth' => ! empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
                    'gender' => ! empty($data['gender']) ? $data['gender'] : null,
                ]);
            }

            if ($schoolClass) {
                if ($academicYear) {
                    $enrollment = StudentEnrollment::where('student_id', $student->id)
                        ->where('academic_year_id', $academicYear->id)
                        ->where('status', 'active')
                        ->first();

                    if ($enrollment) {
                        if ($enrollment->school_class_id !== $schoolClass->id) {
                            $enrollment->update(['school_class_id' => $schoolClass->id]);
                        }
                    } else {
                        StudentEnrollment::create([
                            'student_id' => $student->id,
                            'academic_year_id' => $academicYear->id,
                            'school_class_id' => $schoolClass->id,
                            'status' => 'active',
                            'enrolled_at' => now()->toDateString(),
                        ]);
                    }
                } else {
                    $result['warnings'][] = 'No academic year configured — student created without enrollment.';
                }
            }

            if ($enrollmentYear !== null) {
                $student->enrollment_year = $enrollmentYear;
                $student->save();
            }

            return $student;
        });

        $result['student_id'] = $student->id;

        return $result;
    }

    protected function resolveCurrentAcademicYear(): ?AcademicYear
    {
        $term = Term::where('is_current', true)->with('academicYear')->first();

        return $term?->academicYear ?? AcademicYear::orderByDesc('start_date')->first();
    }

    protected function normalizeHeader(array $header): array
    {
        return array_map(fn ($h) => strtolower(trim((string) $h)), $header);
    }

    /**
     * Case/whitespace-tolerant so "Standard  1" (a doubled space, common in
     * real spreadsheet exports) still matches a class named "Standard 1".
     */
    protected function normalizeClassName(string $name): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $name)));
    }
}
