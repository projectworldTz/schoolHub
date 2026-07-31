<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * A manual escape hatch for the same flow SchoolService::create() does
 * automatically for new owners — needed for accounts created before that
 * existed, or whenever production mail isn't set up yet to deliver a
 * forgot-password link. Sets must_change_password so the printed password
 * still can't become a standing credential.
 */
class GenerateTemporaryPasswordCommand extends Command
{
    protected $signature = 'password:generate-temporary {email}';

    protected $description = 'Generate and print a one-time temporary password for an existing user';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = Tenant::runAsPlatform(fn () => User::where('email', $email)->first());

        if (! $user) {
            $this->error("No account found for {$email}.");

            return self::FAILURE;
        }

        $temporaryPassword = Str::password(12);

        $user->forceFill([
            'password' => Hash::make($temporaryPassword),
            'must_change_password' => true,
        ])->save();

        $this->newLine();
        $this->info("Temporary password for {$user->name} ({$user->email}):");
        $this->newLine();
        $this->line("    {$temporaryPassword}");
        $this->newLine();
        $this->warn("This is shown once — copy it now. They'll be required to set their own password on next login.");

        return self::SUCCESS;
    }
}
