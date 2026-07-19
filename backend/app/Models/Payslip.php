<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity;

    protected $attributes = [
        'status' => 'pending',
    ];

    protected $fillable = [
        'school_id',
        'payroll_run_id',
        'user_id',
        'basic_salary',
        'allowances',
        'deductions',
        'net_salary',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'basic_salary' => 'decimal:2',
            'allowances' => 'decimal:2',
            'deductions' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function activityDescription(string $action): string
    {
        return "Payslip {$action} for user {$this->user_id}: net {$this->net_salary}, status {$this->status}";
    }
}
