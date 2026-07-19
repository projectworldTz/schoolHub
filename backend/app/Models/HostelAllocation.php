<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostelAllocation extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $attributes = [
        'status' => 'active',
    ];

    protected $fillable = [
        'school_id',
        'student_id',
        'hostel_room_id',
        'academic_year_id',
        'allocated_at',
        'vacated_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'allocated_at' => 'date',
            'vacated_at' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(HostelRoom::class, 'hostel_room_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
