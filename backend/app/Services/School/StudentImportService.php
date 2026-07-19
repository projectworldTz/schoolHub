<?php

namespace App\Services\School;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Term;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Bulk student onboarding from a CSV export of whatever a school already
 * uses (a spreadsheet, another system's export) — the single biggest gap
 * in bringing a new school onto the platform, which otherwise means
 * typing every student in one at a time via StudentController.
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
                'error_count' => 0,
                'committed' => false,
                'missing_headers' => $missingHeaders,
                'rows' => [],
            ];
        }

        $seenAdmissionNumbers = [];
        $rows = [];
        $rowNumber = 1;

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

            $rows[] = $this->processRow($data, $rowNumber, $commit, $seenAdmissionNumbers);
        }

        fclose($handle);

        return [
            'total_rows' => count($rows),
            'created_count' => count(array_filter($rows, fn ($r) => $r['status'] === 'created' || $r['status'] === 'would_create')),
            'error_count' => count(array_filter($rows, fn ($r) => $r['status'] === 'error')),
            'committed' => $commit,
            'missing_headers' => [],
            'rows' => $rows,
        ];
    }

    protected function processRow(array $data, int $rowNumber, bool $commit, array &$seenAdmissionNumbers): array
    {
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

        if ($admissionNumber !== '') {
            if (in_array($admissionNumber, $seenAdmissionNumbers, true)) {
                $errors[] = "Duplicate admission number '{$admissionNumber}' earlier in this file.";
            } elseif (Student::where('admission_number', $admissionNumber)->exists()) {
                $errors[] = "Admission number '{$admissionNumber}' already exists.";
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

        $schoolClass = null;
        if (! empty($data['class_name'])) {
            $schoolClass = SchoolClass::whereRaw('lower(name) = ?', [strtolower($data['class_name'])])->first();
            if (! $schoolClass) {
                $result['warnings'][] = "Class '{$data['class_name']}' not found — student created without enrollment.";
            }
        }

        if (! $commit) {
            $result['status'] = 'would_create';

            return $result;
        }

        $student = DB::transaction(function () use ($admissionNumber, $firstName, $lastName, $data, $schoolClass, &$result) {
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

            if ($schoolClass) {
                $academicYearId = Term::where('is_current', true)->value('academic_year_id')
                    ?? \App\Models\AcademicYear::orderByDesc('start_date')->value('id');

                if ($academicYearId) {
                    StudentEnrollment::create([
                        'student_id' => $student->id,
                        'academic_year_id' => $academicYearId,
                        'school_class_id' => $schoolClass->id,
                        'status' => 'active',
                        'enrolled_at' => now()->toDateString(),
                    ]);
                } else {
                    $result['warnings'][] = 'No academic year configured — student created without enrollment.';
                }
            }

            return $student;
        });

        $result['status'] = 'created';
        $result['student_id'] = $student->id;

        return $result;
    }

    protected function normalizeHeader(array $header): array
    {
        return array_map(fn ($h) => strtolower(trim((string) $h)), $header);
    }
}
