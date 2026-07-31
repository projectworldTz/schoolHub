<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * A tinker-free way to verify mail delivery (MAIL_MAILER=smtp + Brevo
 * credentials) — some hosts disable shell_exec/proc_open, which breaks
 * PsySH's own startup before it ever reaches a typed command, so `php
 * artisan tinker` isn't usable there at all.
 */
class SendTestMailCommand extends Command
{
    protected $signature = 'mail:test {email}';

    protected $description = 'Send a plain test email to confirm mail delivery is configured correctly';

    public function handle(): int
    {
        $email = $this->argument('email');

        Mail::raw(
            'This is a test email from SchoolHub, sent at '.now()->toDateTimeString().'.',
            fn ($message) => $message->to($email)->subject('SchoolHub mail test')
        );

        $this->info("Test email sent to {$email}. Check that inbox (and spam folder).");

        return self::SUCCESS;
    }
}
