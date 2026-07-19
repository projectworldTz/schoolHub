<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClinicVisit extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'school_id',
        'student_id',
        'visit_date',
        'reason',
        'diagnosis',
        'treatment',
        'follow_up_date',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date',
            'follow_up_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
