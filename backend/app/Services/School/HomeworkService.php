<?php

namespace App\Services\School;

use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\StudentEnrollment;
use Illuminate\Support\Facades\DB;

class HomeworkService
{
    /**
     * A submission row is created up front for every actively-enrolled
     * student in the target class/stream, status 'pending' — see the
     * migration's comment for why (so "who hasn't submitted" is a plain
     * query, not a roster diff).
     */
    public function create(array $attributes): Homework
    {
        return DB::transaction(function () use ($attributes) {
            $homework = Homework::create($attributes);

            $studentIds = StudentEnrollment::query()
                ->where('academic_year_id', $attributes['academic_year_id'])
                ->where('school_class_id', $attributes['school_class_id'])
                ->when($attributes['stream_id'] ?? null, fn ($q, $id) => $q->where('stream_id', $id))
                ->where('status', 'active')
                ->pluck('student_id');

            foreach ($studentIds as $studentId) {
                HomeworkSubmission::create([
                    'homework_id' => $homework->id,
                    'student_id' => $studentId,
                ]);
            }

            return $homework;
        });
    }
}
