<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffSalary extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $attributes = [
        'allowances' => 0,
        'deductions' => 0,
    ];

    protected $fillable = [
        'school_id',
        'user_id',
        'basic_salary',
        'allowances',
        'deductions',
        'effective_from',
    ];

    protected function casts(): array
    {
        return [
            'basic_salary' => 'decimal:2',
            'allowances' => 'decimal:2',
            'deductions' => 'decimal:2',
            'effective_from' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getNetSalaryAttribute(): string
    {
        return bcsub(bcadd((string) $this->basic_salary, (string) $this->allowances, 2), (string) $this->deductions, 2);
    }
}
