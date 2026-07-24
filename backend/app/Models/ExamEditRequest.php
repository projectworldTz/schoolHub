<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A grading teacher's request to reopen a gradebook that's past its 24-hour
 * post-submission edit window (see ExamSubject::isLocked()). Modeled 1:1 on
 * LeaveRequest: submit with a reason, an Academic Master (or equivalent,
 * via the 'exams.manage' permission) approves or rejects. Approval doesn't
 * unlock forever — it opens a fresh 24h window (unlocked_until) so a
 * granted correction doesn't quietly leave the gradebook open indefinitely.
 */
class ExamEditRequest extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $attributes = [
        'status' => 'pending',
    ];

    protected $fillable = [
        'school_id',
        'exam_subject_id',
        'requested_by',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'unlocked_until',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'unlocked_until' => 'datetime',
        ];
    }

    public function examSubject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    protected function activityDescription(string $action): string
    {
        return "Exam edit request {$action} (status {$this->status})";
    }
}
