<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CafeteriaMenu extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'meal_type' => 'lunch',
    ];

    protected $fillable = [
        'school_id',
        'menu_date',
        'meal_type',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'menu_date' => 'date',
        ];
    }
}
