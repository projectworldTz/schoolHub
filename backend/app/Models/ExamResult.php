<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'school_id',
        'exam_subject_id',
        'student_id',
        'marks_obtained',
        'grade',
        'remarks',
        'entered_by',
    ];

    protected function casts(): array
    {
        return [
            'marks_obtained' => 'decimal:2',
        ];
    }

    public function examSubject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    /**
     * Not 'created': a stub row is created for every student the moment a
     * subject is added to an exam, before anyone has graded anything — the
     * only audit-worthy moment is later, when marks actually change.
     */
    protected function logsActivityOn(): array
    {
        return ['updated'];
    }

    protected function activityDescription(string $action): string
    {
        return "Marks {$action} for student {$this->student_id}: {$this->marks_obtained} ({$this->grade})";
    }
}
