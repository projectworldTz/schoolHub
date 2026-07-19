<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffProfile extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'employment_type' => 'full_time',
    ];

    protected $fillable = [
        'school_id',
        'user_id',
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
}
