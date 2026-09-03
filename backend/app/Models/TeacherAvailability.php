<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TeacherAvailability extends Model
{
    use BelongsToSchool, HasUuids;

    protected $fillable = ['school_id', 'teacher_id', 'academic_year_id', 'timetable_period_id', 'day_of_week', 'is_available'];

    protected function casts(): array
    {
        return ['is_available' => 'boolean'];
    }
}
