<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A grade/form level (e.g. "Form 1", "Grade 5"). Named SchoolClass because
 * `class` is a reserved word in PHP.
 */
class SchoolClass extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $table = 'school_classes';

    protected $fillable = [
        'school_id',
        'branch_id',
        'name',
        'level',
        'duration_years',
    ];

    protected $attributes = [
        'duration_years' => 1,
    ];

    protected function casts(): array
    {
        return [
            'duration_years' => 'integer',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function streams(): HasMany
    {
        return $this->hasMany(Stream::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'class_subject');
    }

    public function assignedTeachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_teacher');
    }

    public function timetableEntries(): HasMany
    {
        return $this->hasMany(TimetableEntry::class);
    }

    public function homeworks(): HasMany
    {
        return $this->hasMany(Homework::class);
    }

    public function examSubjects(): HasMany
    {
        return $this->hasMany(ExamSubject::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    protected function activityDescription(string $action): string
    {
        return "Class \"{$this->name}\" {$action}";
    }
}
