<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffProfile extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $attributes = [
        'employment_type' => 'full_time',
    ];

    protected $fillable = [
        'school_id',
        'user_id',
        'name',
        'phone',
        'department_id',
        'branch_id',
        'staff_number',
        'job_title',
        'employment_type',
        'hire_date',
        'termination_date',
        'bio',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'termination_date' => 'date',
        ];
    }

    /**
     * name/phone on this table are only meaningful for a no-login staff
     * member (user_id null) — support staff like cooks/drivers/gate keepers
     * who don't need a system account. For a login-backed staff member,
     * these columns stay null and the real values live on the linked User.
     */
    public function displayName(): string
    {
        return $this->user?->name ?? $this->name ?? '';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    protected function activityDescription(string $action): string
    {
        return "Staff profile ({$this->staff_number}, {$this->job_title}) {$action}";
    }
}
