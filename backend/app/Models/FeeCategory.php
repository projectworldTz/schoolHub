<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeCategory extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'description',
    ];

    public function feeStructures(): HasMany
    {
        return $this->hasMany(FeeStructure::class);
    }

    protected function activityDescription(string $action): string
    {
        return "Fee category \"{$this->name}\" {$action}";
    }
}
