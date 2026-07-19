<?php

namespace App\Services\School;

use App\Models\TransportAssignment;
use App\Models\TransportRoute;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransportService
{
    public function assign(array $data): TransportAssignment
    {
        return DB::transaction(function () use ($data) {
            $route = TransportRoute::whereKey($data['transport_route_id'])->lockForUpdate()->first();

            if ($route->capacity && $route->activeAssignments()->count() >= $route->capacity) {
                throw ValidationException::withMessages([
                    'transport_route_id' => 'This route is already at full capacity.',
                ]);
            }

            // Superseding any existing active assignment for the student mirrors
            // the one-active-enrollment-per-year pattern used elsewhere.
            TransportAssignment::where('student_id', $data['student_id'])
                ->where('status', 'active')
                ->update(['status' => 'inactive']);

            return TransportAssignment::create([
                'student_id' => $data['student_id'],
                'transport_route_id' => $data['transport_route_id'],
                'academic_year_id' => $data['academic_year_id'],
                'pickup_point' => $data['pickup_point'] ?? null,
            ]);
        });
    }

    public function unassign(TransportAssignment $assignment): TransportAssignment
    {
        if ($assignment->status === 'inactive') {
            throw ValidationException::withMessages([
                'status' => 'This assignment is already inactive.',
            ]);
        }

        $assignment->update(['status' => 'inactive']);

        return $assignment;
    }
}
