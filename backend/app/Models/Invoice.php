<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $attributes = [
        'total_amount' => 0,
        'amount_paid' => 0,
        'status' => 'unpaid',
    ];

    protected $fillable = [
        'school_id',
        'student_id',
        'academic_year_id',
        'term_id',
        'invoice_number',
        'total_amount',
        'amount_paid',
        'status',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function getBalanceAttribute(): string
    {
        return bcsub((string) $this->total_amount, (string) $this->amount_paid, 2);
    }

    protected function activityDescription(string $action): string
    {
        return "Invoice {$this->invoice_number} {$action} (total {$this->total_amount}, status {$this->status})";
    }
}
