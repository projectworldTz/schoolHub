<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Student extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    /**
     * Mirrors the DB column default so a freshly created instance reflects
     * 'active' immediately, instead of showing null until the row is
     * re-fetched (Eloquent doesn't know about DB-level defaults on its own).
     */
    protected $attributes = [
        'status' => 'active',
    ];

    protected $fillable = [
        'school_id',
        'user_id',
        'admission_number',
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'photo_path',
        'blood_group',
        'allergies',
        'medical_notes',
        'emergency_contact_name',
        'emergency_contact_phone',
        'previous_school_name',
        'status',
    ];

    /**
     * Set by a controller before calling update() to attach a reason/
     * effective-date to the StudentStatusChange row the booted() hook below
     * writes automatically — not persisted on the student itself.
     */
    public ?string $statusChangeReason = null;
    public ?string $statusChangeDate = null;

    protected static function booted(): void
    {
        static::creating(function (Student $student) {
            $student->qr_code ??= (string) Str::uuid();
        });

        static::updated(function (Student $student) {
            if (! $student->wasChanged('status')) {
                return;
            }

            $student->statusChanges()->create([
                'school_id' => $student->school_id,
                'from_status' => $student->getOriginal('status'),
                'to_status' => $student->status,
                'effective_date' => $student->statusChangeDate ?? now()->toDateString(),
                'reason' => $student->statusChangeReason,
                'changed_by' => auth()->id(),
            ]);
        });
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'student_guardian')
            ->withPivot(['relationship', 'is_primary', 'is_emergency_contact'])
            ->withTimestamps();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(StudentEnrollment::class)->where('status', 'active')->latestOfMany('enrolled_at');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function homeworkSubmissions(): HasMany
    {
        return $this->hasMany(HomeworkSubmission::class);
    }

    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function bookLoans(): HasMany
    {
        return $this->hasMany(BookLoan::class);
    }

    public function hostelAllocations(): HasMany
    {
        return $this->hasMany(HostelAllocation::class);
    }

    public function transportAssignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class);
    }

    public function clinicVisits(): HasMany
    {
        return $this->hasMany(ClinicVisit::class);
    }

    public function disciplineIncidents(): HasMany
    {
        return $this->hasMany(DisciplineIncident::class);
    }

    public function statusChanges(): HasMany
    {
        return $this->hasMany(StudentStatusChange::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
