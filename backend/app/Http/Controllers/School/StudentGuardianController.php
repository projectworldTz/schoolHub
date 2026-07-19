<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AttachGuardianRequest;
use App\Http\Resources\School\StudentResource;
use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentGuardianController extends Controller
{
    public function store(AttachGuardianRequest $request, Student $student)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $student) {
            $guardian = isset($data['guardian_id'])
                ? Guardian::findOrFail($data['guardian_id'])
                : Guardian::create([
                    'name' => $data['name'],
                    'phone' => $data['phone'] ?? null,
                    'email' => $data['email'] ?? null,
                    'occupation' => $data['occupation'] ?? null,
                    'address' => $data['address'] ?? null,
                ]);

            $student->guardians()->syncWithoutDetaching([
                $guardian->id => [
                    'relationship' => $data['relationship'],
                    'is_primary' => $data['is_primary'] ?? false,
                    'is_emergency_contact' => $data['is_emergency_contact'] ?? false,
                ],
            ]);
        });

        return new StudentResource($student->load('guardians'));
    }

    public function destroy(Request $request, Student $student, Guardian $guardian)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        $student->guardians()->detach($guardian->id);

        return response()->noContent();
    }
}
