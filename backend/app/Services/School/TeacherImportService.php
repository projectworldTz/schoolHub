<?php

namespace App\Services\School;

use App\Mail\AccountActivationMail;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\StaffProfile;
use App\Models\User;
use App\Support\SchoolRoles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Bulk teacher/staff onboarding from a CSV — the staff-side counterpart to
 * StudentImportService, same "preview, then confirm" shape (process() always
 * validates and reports every row; $commit just controls whether valid rows
 * are actually persisted). A row here does in one shot what previously took
 * two separate admin actions: creating the user account (SchoolUserController)
 * and creating the staff profile against it (StaffProfileController) — bulk
 * import has no meaningful "pick an existing user" step mid-file.
 *
 * Imported teachers never get a password from the CSV or the admin — one is
 * generated and never communicated, same as SchoolService::create() for a
 * new School Owner, and an activation email is sent after commit so they can
 * set their own password.
 */
class TeacherImportService
{
    protected const REQUIRED_HEADERS = ['full_name', 'email', 'role'];

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

        $allowedRoles = SchoolRoles::forType($school->type);
        $seenEmails = [];
        $rows = [];
        $rowNumber = 1;

        while (($line = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if (count(array_filter($line, fn ($v) => $v !== null && $v !== '')) === 0) {
                continue;
            }

            $data = array_combine($header, array_pad($line, count($header), null));
            $data = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $data);

            $rows[] = $this->processRow($data, $rowNumber, $commit, $school, $allowedRoles, $seenEmails);
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

    protected function processRow(array $data, int $rowNumber, bool $commit, School $school, array $allowedRoles, array &$seenEmails): array
    {
        $fullName = $data['full_name'] ?? '';
        $email = strtolower($data['email'] ?? '');
        $role = $data['role'] ?? '';
        $errors = [];

        if ($fullName === '') {
            $errors[] = 'Full name is required.';
        }
        if ($email === '') {
            $errors[] = 'Email is required.';
        }
        if ($role === '') {
            $errors[] = 'Role is required.';
        } elseif (! in_array($role, $allowedRoles, true)) {
            $errors[] = "Role '{$role}' is not available for this school.";
        }

        if ($email !== '') {
            if (in_array($email, $seenEmails, true)) {
                $errors[] = "Duplicate email '{$email}' earlier in this file.";
            } elseif (User::withoutGlobalScopes()->where('email', $email)->exists()) {
                $errors[] = "Email '{$email}' already exists.";
            }
        }

        $result = [
            'row' => $rowNumber,
            'email' => $email,
            'name' => $fullName,
            'status' => 'error',
            'errors' => $errors,
            'warnings' => [],
        ];

        if (! empty($errors)) {
            return $result;
        }

        $seenEmails[] = $email;

        $staffNumber = trim((string) ($data['staff_number'] ?? ''));
        if ($staffNumber !== '' && StaffProfile::where('school_id', $school->id)->where('staff_number', $staffNumber)->exists()) {
            $result['errors'][] = "Staff number '{$staffNumber}' already exists.";
            $result['status'] = 'error';

            return $result;
        }
        if ($staffNumber === '') {
            $staffNumber = 'STF-'.Str::upper(Str::random(6));
        }

        $employmentType = in_array($data['employment_type'] ?? null, ['full_time', 'part_time', 'contract'], true)
            ? $data['employment_type']
            : 'full_time';

        $schoolClass = null;
        if (! empty($data['class_assigned'])) {
            $schoolClass = SchoolClass::whereRaw('lower(name) = ?', [strtolower($data['class_assigned'])])->first();
            if (! $schoolClass) {
                $result['warnings'][] = "Class '{$data['class_assigned']}' not found — teacher created without a class assignment.";
            }
        }

        if (! $commit) {
            $result['status'] = 'would_create';

            return $result;
        }

        $user = DB::transaction(function () use ($fullName, $email, $data, $school, $role, $staffNumber, $employmentType, $schoolClass) {
            $user = User::create([
                'school_id' => $school->id,
                'name' => $fullName,
                'email' => $email,
                'phone' => $data['phone'] ?? null,
                // Random, never-communicated password — see class docblock.
                'password' => Hash::make(Str::random(40)),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $user->assignRole($role);

            StaffProfile::create([
                'school_id' => $school->id,
                'user_id' => $user->id,
                'staff_number' => $staffNumber,
                'job_title' => $data['job_title'] ?? null,
                'employment_type' => $employmentType,
                'hire_date' => ! empty($data['hire_date']) ? $data['hire_date'] : null,
            ]);

            if ($schoolClass) {
                $user->assignedClasses()->attach($schoolClass->id);
            }

            return $user;
        });

        // Outside the transaction — a mail failure must not roll back the
        // teacher that was just successfully created.
        $token = Password::broker()->createToken($user);
        Mail::to($user)->send(new AccountActivationMail($user, $school, $token, "a **{$role}** at **{$school->name}**"));

        $result['status'] = 'created';
        $result['user_id'] = $user->id;

        return $result;
    }

    protected function normalizeHeader(array $header): array
    {
        return array_map(fn ($h) => strtolower(trim((string) $h)), $header);
    }
}
