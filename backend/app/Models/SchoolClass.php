<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
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
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'school_classes';

    protected $fillable = [
        'school_id',
        'branch_id',
        'name',
        'level',
    ];

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
}
