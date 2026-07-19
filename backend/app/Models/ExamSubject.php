<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSubject extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $attributes = [
        'max_marks' => 100,
    ];

    protected $fillable = [
        'school_id',
        'exam_id',
        'school_class_id',
        'subject_id',
        'max_marks',
        'pass_marks',
        'exam_date',
    ];

    protected function casts(): array
    {
        return [
            'max_marks' => 'decimal:2',
            'pass_marks' => 'decimal:2',
            'exam_date' => 'date',
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }
}
