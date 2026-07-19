<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'total_copies' => 1,
        'available_copies' => 1,
    ];

    protected $fillable = [
        'school_id',
        'title',
        'author',
        'isbn',
        'category',
        'total_copies',
        'available_copies',
    ];

    public function loans(): HasMany
    {
        return $this->hasMany(BookLoan::class);
    }
}
