<?php

namespace App\Services\School;

use App\Mail\AccountActivationMail;
use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Bulk guardian onboarding from a CSV, one (student, guardian) pair per row
 * — same "preview, then confirm" shape as StudentImportService/
 * TeacherImportService. Fuses two previously-separate admin actions:
 * StudentGuardianController::store() (attach a guardian to a student) and
 * GuardianPortalController::store() (grant that guardian a Parent Portal
 * login) — a guardian with an email gets both in one row.
 *
 * A guardian is matched by email within the school (student_admission_number
 * is only how a *row* finds its student, not how guardians are deduped) so
 * "one guardian, two kids, two rows" links both children to the same
 * guardian record instead of creating a duplicate.
 */
class GuardianImportService
{
    protected const REQUIRED_HEADERS = ['student_admission_number', 'guardian_name', 'relationship'];

    protected const TRUTHY = ['yes', 'true', '1'];

    public function process(UploadedFile $file, bool $commit, School $school): array
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

        $rows = [];
        $rowNumber = 1;

        while (($line = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if (count(array_filter($line, fn ($v) => $v !== null && $v !== '')) === 0) {
                continue;
            }

            $data = array_combine($header, array_pad($line, count($header), null));
            $data = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $data);

            $rows[] = $this->processRow($data, $rowNumber, $commit, $school);
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

    protected function processRow(array $data, int $rowNumber, bool $commit, School $school): array
    {
        $admissionNumber = $data['student_admission_number'] ?? '';
        $guardianName = $data['guardian_name'] ?? '';
        $relationship = $data['relationship'] ?? '';
        $email = strtolower($data['email'] ?? '');
        $errors = [];

        if ($admissionNumber === '') {
            $errors[] = 'Student admission number is required.';
        }
        if ($guardianName === '') {
            $errors[] = 'Guardian name is required.';
        }
        if ($relationship === '') {
            $errors[] = 'Relationship is required.';
        }

        $student = $admissionNumber !== '' ? Student::where('admission_number', $admissionNumber)->first() : null;
        if ($admissionNumber !== '' && ! $student) {
            $errors[] = "Student with admission number '{$admissionNumber}' not found — import the student first.";
        }

        $result = [
            'row' => $rowNumber,
            'admission_number' => $admissionNumber,
            'name' => $guardianName,
            'status' => 'error',
            'errors' => $errors,
            'warnings' => [],
        ];

        if (! empty($errors)) {
            return $result;
        }

        if (! $commit) {
            $result['status'] = 'would_create';

            return $result;
        }

        DB::transaction(function () use ($guardianName, $relationship, $email, $data, $school, $student, &$result) {
            $guardian = $email !== ''
                ? Guardian::where('school_id', $school->id)->where('email', $email)->first()
                : null;

            if ($guardian) {
                $result['warnings'][] = 'Linked to an existing guardian record (matched by email).';
            } else {
                $guardian = Guardian::create([
                    'school_id' => $school->id,
                    'name' => $guardianName,
                    'phone' => $data['phone'] ?? null,
                    'email' => $email !== '' ? $email : null,
                    'occupation' => $data['occupation'] ?? null,
                    'address' => $data['address'] ?? null,
                ]);
            }

            $student->guardians()->syncWithoutDetaching([
                $guardian->id => [
                    'relationship' => $relationship,
                    'is_primary' => in_array(strtolower((string) ($data['is_primary'] ?? '')), self::TRUTHY, true),
                    'is_emergency_contact' => in_array(strtolower((string) ($data['is_emergency_contact'] ?? '')), self::TRUTHY, true),
                ],
            ]);

            $result['guardian_id'] = $guardian->id;

            if ($email === '' || $guardian->user_id) {
                return;
            }

            if (User::withoutGlobalScopes()->where('email', $email)->exists()) {
                $result['warnings'][] = "Email '{$email}' is already in use by another account — portal access not created.";

                return;
            }

            $user = User::create([
                'school_id' => $school->id,
                'name' => $guardianName,
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $user->assignRole('Parent');
            $guardian->update(['user_id' => $user->id]);

            $result['portal_user_id'] = $user->id;
        });

        if (isset($result['portal_user_id'])) {
            $user = User::withoutGlobalScopes()->find($result['portal_user_id']);
            $token = Password::broker()->createToken($user);
            Mail::to($user)->send(new AccountActivationMail($user, $school, $token, "a parent/guardian at **{$school->name}**"));
        }

        $result['status'] = 'created';

        return $result;
    }

    protected function normalizeHeader(array $header): array
    {
        return array_map(fn ($h) => strtolower(trim((string) $h)), $header);
    }
}
