<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use BelongsToSchool, HasApiTokens, HasFactory, HasRoles, HasUuids, LogsActivity, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'school_id',
        'name',
        'email',
        'phone',
        'password',
        'is_active',
        'must_change_password',
        'announcements_last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'announcements_last_seen_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * users.email is DB-unique, and soft delete (this model's normal
     * "Remove" action) leaves the row in place — without this, a deleted
     * account's email would stay permanently unavailable even though
     * removing the account implies it's free to reuse. Runs via query
     * builder (not ->save()) because the row is already trashed by the
     * time this fires, so the BelongsToSchool/SoftDeletingScope global
     * scopes would otherwise exclude it from a normal Eloquent update.
     */
    protected static function booted(): void
    {
        static::deleted(function (User $user) {
            if ($user->isForceDeleting() || str_contains($user->email, '+deleted-')) {
                return;
            }

            static::withTrashed()->whereKey($user->id)->update([
                'email' => static::deletedEmailFor($user->email, $user->id),
            ]);
        });
    }

    public static function deletedEmailFor(string $email, string $id): string
    {
        [$local, $domain] = str_contains($email, '@') ? explode('@', $email, 2) : [$email, 'deleted.invalid'];

        return substr("{$local}+deleted-{$id}@{$domain}", 0, 255);
    }

    public function staffProfile(): HasOne
    {
        return $this->hasOne(StaffProfile::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function guardianProfile(): HasOne
    {
        return $this->hasOne(Guardian::class);
    }

    public function subjectsTaught(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject');
    }

    public function assignedClasses(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_teacher');
    }

    /**
     * Every class this user is assigned to — explicit admin assignments
     * (class_teacher pivot) plus any stream where they're the homeroom
     * teacher (Stream::class_teacher_id), so existing homeroom assignments
     * scope correctly with no separate backfill required.
     */
    public function assignedClassIds(): \Illuminate\Support\Collection
    {
        $direct = $this->assignedClasses()->pluck('school_classes.id');
        $homeroom = Stream::where('class_teacher_id', $this->id)->pluck('school_class_id');

        return $direct->merge($homeroom)->unique()->values();
    }

    /**
     * classes.manage holders (School Owner, Principal, Academic Master,
     * Head of Department, etc.) see/manage every class; everyone else is
     * scoped to their own assigned classes.
     */
    public function canAccessClass(string $schoolClassId): bool
    {
        return $this->can('classes.manage') || $this->assignedClassIds()->contains($schoolClassId);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(StaffContract::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function examEditRequests(): HasMany
    {
        return $this->hasMany(ExamEditRequest::class, 'requested_by');
    }

    public function timetableEntries(): HasMany
    {
        return $this->hasMany(TimetableEntry::class, 'teacher_id');
    }

    public function homeworksSet(): HasMany
    {
        return $this->hasMany(Homework::class, 'teacher_id');
    }

    public function coursesTaught(): HasMany
    {
        return $this->hasMany(Course::class, 'teacher_id');
    }

    public function salary(): HasOne
    {
        return $this->hasOne(StaffSalary::class);
    }

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * The password hash and remember token change on every login/reset —
     * neither is a "who changed what" event worth surfacing in the audit
     * log, and a hash has no business sitting in a changes column even
     * though it's already irreversible.
     */
    protected function activityExcludedAttributes(): array
    {
        return ['password', 'remember_token'];
    }

    protected function activityDescription(string $action): string
    {
        return "User {$this->name} ({$this->email}) {$action}";
    }
}
