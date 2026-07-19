<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'quantity' => 0,
    ];

    protected $fillable = [
        'school_id',
        'name',
        'category',
        'unit',
        'quantity',
        'reorder_level',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class);
    }
}
