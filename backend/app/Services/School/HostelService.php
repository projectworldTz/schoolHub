<?php

namespace App\Services\School;

use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HostelService
{
    public function allocate(array $data): HostelAllocation
    {
        return DB::transaction(function () use ($data) {
            $room = HostelRoom::whereKey($data['hostel_room_id'])->lockForUpdate()->first();

            if ($room->activeAllocations()->count() >= $room->capacity) {
                throw ValidationException::withMessages([
                    'hostel_room_id' => 'This room is already at full capacity.',
                ]);
            }

            // Superseding any existing active allocation for the student mirrors
            // the one-active-enrollment-per-year pattern used elsewhere.
            HostelAllocation::where('student_id', $data['student_id'])
                ->where('status', 'active')
                ->update(['status' => 'vacated', 'vacated_at' => now()]);

            return HostelAllocation::create([
                'student_id' => $data['student_id'],
                'hostel_room_id' => $data['hostel_room_id'],
                'academic_year_id' => $data['academic_year_id'],
                'allocated_at' => $data['allocated_at'] ?? now(),
            ]);
        });
    }

    public function vacate(HostelAllocation $allocation): HostelAllocation
    {
        if ($allocation->status === 'vacated') {
            throw ValidationException::withMessages([
                'status' => 'This allocation has already been vacated.',
            ]);
        }

        $allocation->update(['status' => 'vacated', 'vacated_at' => now()]);

        return $allocation;
    }
}
