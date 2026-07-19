<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentStatusChange extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $fillable = [
        'school_id',
        'student_id',
        'from_status',
        'to_status',
        'effective_date',
        'reason',
        'changed_by',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
