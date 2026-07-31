<?php

namespace App\Services\Platform;

use App\Models\School;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolService
{
    public function create(array $data): School
    {
        $ownerName = $data['owner_name'];
        $ownerEmail = $data['owner_email'];
        $ownerPhone = $data['owner_phone'] ?? null;
        $licenseDurationMonths = $data['license_duration_months'];
        unset($data['owner_name'], $data['owner_email'], $data['owner_phone'], $data['license_duration_months']);

        $data['status'] = 'pending';
        $data['license_expires_at'] = now()->addMonths($licenseDurationMonths);

        // Shown once in the platform admin UI so it can be relayed to the
        // owner directly (phone/WhatsApp/email) — never persisted in
        // plaintext or emailed automatically by this app.
        $temporaryPassword = Str::password(12);

        $school = DB::transaction(function () use ($data, $ownerName, $ownerEmail, $ownerPhone, $temporaryPassword) {
            $school = School::create($data);

            $owner = Tenant::runAsPlatform(function () use ($school, $ownerName, $ownerEmail, $ownerPhone, $temporaryPassword) {
                $user = User::create([
                    'school_id' => $school->id,
                    'name' => $ownerName,
                    'email' => $ownerEmail,
                    'phone' => $ownerPhone,
                    'password' => Hash::make($temporaryPassword),
                    'is_active' => true,
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('School Owner');

                return $user;
            });

            return $school->setRelation('owner', $owner);
        });

        // Not a real column — lives only on this in-memory instance so
        // SchoolResource can surface it in this one response.
        $school->owner->temporary_password = $temporaryPassword;

        return $school;
    }

    public function update(School $school, array $data): School
    {
        $school->update($data);

        return $school;
    }

    public function approve(School $school): School
    {
        $school->update([
            'status' => 'approved',
            'approved_at' => Carbon::now(),
            'suspended_at' => null,
            'suspension_reason' => null,
        ]);

        return $school;
    }

    public function suspend(School $school, string $reason): School
    {
        $school->update([
            'status' => 'suspended',
            'suspended_at' => Carbon::now(),
            'suspension_reason' => $reason,
        ]);

        return $school;
    }

    /**
     * Extends the license from today, not from whatever the old
     * license_expires_at was — a Super Admin renewing a lapsed or
     * about-to-lapse school means "N more months starting now," not
     * "N months tacked onto an already-passed date."
     */
    public function renewLicense(School $school, int $months): School
    {
        $school->update(['license_expires_at' => Carbon::now()->addMonths($months)]);

        return $school;
    }
}
