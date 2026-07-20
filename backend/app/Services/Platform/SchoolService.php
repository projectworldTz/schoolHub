<?php

namespace App\Services\Platform;

use App\Models\School;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SchoolService
{
    public function create(array $data): School
    {
        $ownerName = $data['owner_name'];
        $ownerEmail = $data['owner_email'];
        $ownerPassword = $data['owner_password'];
        unset($data['owner_name'], $data['owner_email'], $data['owner_password']);

        $data['status'] = 'pending';
        $data['trial_ends_at'] ??= now()->addDays(30);

        return DB::transaction(function () use ($data, $ownerName, $ownerEmail, $ownerPassword) {
            $school = School::create($data);

            $owner = Tenant::runAsPlatform(function () use ($school, $ownerName, $ownerEmail, $ownerPassword) {
                $user = User::create([
                    'school_id' => $school->id,
                    'name' => $ownerName,
                    'email' => $ownerEmail,
                    'password' => Hash::make($ownerPassword),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('School Owner');

                return $user;
            });

            return $school->setRelation('owner', $owner);
        });
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
}
