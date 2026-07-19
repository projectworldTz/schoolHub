<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $fillable = [
        'school_id',
        'user_one_id',
        'user_two_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * Finds (or creates) the single conversation between two users,
     * canonicalizing the pair order so `conversations` unique constraint
     * always catches a duplicate regardless of who initiates.
     */
    public static function between(string $userIdA, string $userIdB): self
    {
        [$one, $two] = [$userIdA, $userIdB];
        if ($one > $two) {
            [$one, $two] = [$two, $one];
        }

        return static::firstOrCreate([
            'user_one_id' => $one,
            'user_two_id' => $two,
        ]);
    }

    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function isParticipant(string $userId): bool
    {
        return $this->user_one_id === $userId || $this->user_two_id === $userId;
    }

    public function otherUserId(string $userId): string
    {
        return $this->user_one_id === $userId ? $this->user_two_id : $this->user_one_id;
    }
}
