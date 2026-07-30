<?php

namespace App\Services\Platform;

use App\Mail\AccountActivationMail;
use App\Models\School;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
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

        $school = DB::transaction(function () use ($data, $ownerName, $ownerEmail, $ownerPhone) {
            $school = School::create($data);

            $owner = Tenant::runAsPlatform(function () use ($school, $ownerName, $ownerEmail, $ownerPhone) {
                // Random, never-communicated password — the account can't
                // be logged into until the owner activates it below.
                $user = User::create([
                    'school_id' => $school->id,
                    'name' => $ownerName,
                    'email' => $ownerEmail,
                    'phone' => $ownerPhone,
                    'password' => Hash::make(Str::random(40)),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('School Owner');

                return $user;
            });

            return $school->setRelation('owner', $owner);
        });

        // Outside the transaction — a mail failure must not roll back the
        // school/owner that were just successfully created.
        $token = Password::broker()->createToken($school->owner);
        Mail::to($school->owner)->send(new AccountActivationMail(
            $school->owner,
            $school,
            $token,
            "the owner of **{$school->name}**",
        ));

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
