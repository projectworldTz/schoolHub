<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity;

    protected $attributes = [
        'method' => 'cash',
    ];

    protected $fillable = [
        'school_id',
        'invoice_id',
        'student_id',
        'amount',
        'method',
        'provider',
        'reference',
        'paid_at',
        'received_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    protected function activityDescription(string $action): string
    {
        return "Payment of {$this->amount} ({$this->method}) {$action} for invoice {$this->invoice_id}";
    }
}
