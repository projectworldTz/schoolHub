<?php

namespace App\Services\Platform;

use App\Models\School;
use Illuminate\Support\Carbon;

class SchoolService
{
    public function create(array $data): School
    {
        $data['status'] = 'pending';
        $data['trial_ends_at'] ??= now()->addDays(30);

        return School::create($data);
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
