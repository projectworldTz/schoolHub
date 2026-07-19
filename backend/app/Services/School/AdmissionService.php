<?php

namespace App\Services\School;

use App\Models\AdmissionApplication;
use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdmissionService
{
    public function accept(AdmissionApplication $application): AdmissionApplication
    {
        $this->assertStatus($application, ['pending', 'under_review']);

        $application->update(['status' => 'accepted']);

        return $application;
    }

    public function reject(AdmissionApplication $application, ?string $notes): AdmissionApplication
    {
        $this->assertStatus($application, ['pending', 'under_review']);

        $application->update(['status' => 'rejected', 'notes' => $notes ?? $application->notes]);

        return $application;
    }

    /**
     * Turns an accepted application into an actual Student + enrollment +
     * guardian link — the one place "applicant" becomes "student".
     */
    public function enroll(AdmissionApplication $application): Student
    {
        $this->assertStatus($application, ['accepted']);

        return DB::transaction(function () use ($application) {
            $student = Student::create([
                'admission_number' => $this->generateAdmissionNumber(),
                'first_name' => $application->applicant_first_name,
                'last_name' => $application->applicant_last_name,
                'date_of_birth' => $application->date_of_birth,
                'gender' => $application->gender,
                'status' => 'active',
            ]);

            $guardian = Guardian::create([
                'name' => $application->guardian_name,
                'phone' => $application->guardian_phone,
                'email' => $application->guardian_email,
            ]);

            $student->guardians()->attach($guardian->id, [
                'relationship' => 'guardian',
                'is_primary' => true,
                'is_emergency_contact' => true,
            ]);

            $student->enrollments()->create([
                'academic_year_id' => $application->academic_year_id,
                'school_class_id' => $application->applying_for_class_id,
                'status' => 'active',
                'enrolled_at' => Carbon::now(),
            ]);

            $application->update(['status' => 'enrolled', 'student_id' => $student->id]);

            return $student;
        });
    }

    protected function generateAdmissionNumber(): string
    {
        return 'ADM-'.now()->format('y').'-'.strtoupper(Str::random(6));
    }

    protected function assertStatus(AdmissionApplication $application, array $allowed): void
    {
        if (! in_array($application->status, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => "Application is '{$application->status}'; expected one of: ".implode(', ', $allowed),
            ]);
        }
    }
}
