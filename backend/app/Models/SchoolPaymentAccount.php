<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A bank/mobile-money account a school publishes so parents know where to
 * send fee payments — deliberately a list (not a single pair of columns on
 * School) since a school routinely uses several: separate TZS accounts at
 * different banks plus a USD account, for example.
 */
class SchoolPaymentAccount extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $fillable = [
        'school_id',
        'account_name',
        'account_number',
        'currency',
    ];

    protected function activityDescription(string $action): string
    {
        return "Payment account \"{$this->account_name}\" {$action}";
    }
}
