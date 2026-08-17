<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Console\Command;

/**
 * One-off backfill for accounts soft-deleted before User::booted() started
 * freeing the email column on delete — those rows still hold their
 * original email, permanently blocking anyone from reusing it. Safe to
 * re-run: skips any row whose email is already mangled.
 */
class FreeDeletedUserEmailsCommand extends Command
{
    protected $signature = 'users:free-deleted-emails';

    protected $description = 'Mangle the email of already soft-deleted users so the address can be reused';

    public function handle(): int
    {
        $trashed = Tenant::runAsPlatform(fn () => User::onlyTrashed()->get(['id', 'email']));

        $fixed = 0;

        foreach ($trashed as $user) {
            if (str_contains($user->email, '+deleted-')) {
                continue;
            }

            Tenant::runAsPlatform(fn () => User::withTrashed()->whereKey($user->id)->update([
                'email' => User::deletedEmailFor($user->email, $user->id),
            ]));

            $fixed++;
        }

        $this->info("Freed {$fixed} deleted account email(s) out of {$trashed->count()} checked.");

        return self::SUCCESS;
    }
}
