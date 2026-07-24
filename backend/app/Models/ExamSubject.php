<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class ExamSubject extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    /** How long a teacher may keep editing after first submitting marks. */
    public const EDIT_GRACE_PERIOD_HOURS = 24;

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
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'max_marks' => 'decimal:2',
            'pass_marks' => 'decimal:2',
            'exam_date' => 'date',
            'submitted_at' => 'datetime',
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

    public function editRequests(): HasMany
    {
        return $this->hasMany(ExamEditRequest::class);
    }

    /** When the post-submission grace period ends; null if never submitted. */
    public function editLockedAt(): ?Carbon
    {
        return $this->submitted_at?->copy()->addHours(self::EDIT_GRACE_PERIOD_HOURS);
    }

    /**
     * Never submitted, or still inside the grace period → editable.
     * Past the grace period → locked, unless an approved edit request has
     * opened a still-valid fresh window (see ExamEditRequest::$unlocked_until).
     */
    public function isLocked(): bool
    {
        $lockedAt = $this->editLockedAt();

        if (! $lockedAt || Carbon::now()->lt($lockedAt)) {
            return false;
        }

        return ! $this->editRequests()
            ->where('status', 'approved')
            ->where('unlocked_until', '>=', Carbon::now())
            ->exists();
    }
}
