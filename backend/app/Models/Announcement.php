<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use BelongsToSchool, HasFactory, HasUuids, SoftDeletes;

    protected $attributes = [
        'audience' => 'school',
        'is_public_website' => false,
    ];

    protected $fillable = [
        'school_id',
        'title',
        'body',
        'audience',
        'school_class_id',
        'role',
        'created_by',
        'published_at',
        'is_public_website',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_public_website' => 'boolean',
        ];
    }

    /**
     * Keeps website_news in sync with is_public_website — a row's mere
     * existence there is what the public site renders, so toggling this
     * flag creates/removes it rather than the public site having to check
     * two tables. No-op for schools without website_enabled: the row still
     * gets created/removed, it's just never read by anything (the public
     * site 404s before it would look here — see Public\WebsiteController).
     */
    protected static function booted(): void
    {
        static::saved(function (Announcement $announcement) {
            if (! $announcement->wasChanged('is_public_website') && ! $announcement->wasRecentlyCreated) {
                return;
            }

            if ($announcement->is_public_website) {
                WebsiteNews::firstOrCreate(
                    ['announcement_id' => $announcement->id],
                    ['school_id' => $announcement->school_id]
                );
            } else {
                WebsiteNews::where('announcement_id', $announcement->id)->delete();
            }
        });
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
