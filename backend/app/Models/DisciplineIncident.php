<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DisciplineIncident extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    /**
     * Mirrors the DB column defaults so a freshly created instance reflects
     * them immediately instead of showing null until re-fetched — same
     * reasoning as Student::$attributes.
     */
    protected $attributes = [
        'severity' => 'minor',
        'status' => 'open',
    ];

    protected $fillable = [
        'school_id',
        'student_id',
        'incident_date',
        'category',
        'severity',
        'description',
        'action_taken',
        'status',
        'reported_by',
    ];

    protected function casts(): array
    {
        return [
            'incident_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
