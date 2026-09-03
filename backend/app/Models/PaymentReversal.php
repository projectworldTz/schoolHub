<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PaymentReversal extends Model
{
    use BelongsToSchool, HasUuids;

    protected $fillable = ['school_id', 'payment_id', 'amount', 'reason', 'reversed_by', 'reversed_at'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'reversed_at' => 'datetime'];
    }
}
