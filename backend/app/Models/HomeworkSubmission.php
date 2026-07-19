<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class HomeworkSubmission extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $attributes = [
        'status' => 'pending',
    ];

    protected $fillable = [
        'school_id',
        'homework_id',
        'student_id',
        'status',
        'submitted_at',
        'grade',
        'feedback',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'grade' => 'decimal:2',
        ];
    }

    public function homework(): BelongsTo
    {
        return $this->belongsTo(Homework::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
