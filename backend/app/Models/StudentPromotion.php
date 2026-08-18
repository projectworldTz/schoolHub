<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPromotion extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $fillable = [
        'school_id',
        'student_id',
        'from_academic_year_id',
        'to_academic_year_id',
        'from_school_class_id',
        'to_school_class_id',
        'action',
        'mode',
        'promoted_by',
        'promoted_at',
    ];

    protected function casts(): array
    {
        return [
            'promoted_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function fromAcademicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'from_academic_year_id');
    }

    public function toAcademicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'to_academic_year_id');
    }

    public function fromSchoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'from_school_class_id');
    }

    public function toSchoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'to_school_class_id');
    }

    public function promotedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'promoted_by');
    }
}
