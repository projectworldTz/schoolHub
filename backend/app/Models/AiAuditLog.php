<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAuditLog extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'school_id',
        'user_id',
        'intent',
        'tool_name',
        'parameters',
        'status',
        'input_tokens',
        'output_tokens',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'parameters' => 'array',
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
