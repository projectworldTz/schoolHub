<?php

namespace App\Mail;

use App\Models\School;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent whenever this app creates a login for someone without them choosing
 * their own password — a new School Owner (SchoolService::create()), an
 * imported teacher (TeacherImportService), or an imported guardian getting
 * Parent Portal access (GuardianImportService). $roleLine is a short,
 * caller-composed phrase completing "You've been set up as {roleLine}" —
 * keeps this Mailable ignorant of which of those flows triggered it.
 */
class AccountActivationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public School $school,
        public string $token,
        public string $roleLine,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your SchoolHub Africa account is ready',
        );
    }

    public function content(): Content
    {
        $activationUrl = sprintf(
            '%s/activate-account?email=%s&token=%s',
            rtrim(config('app.frontend_url'), '/'),
            urlencode($this->user->email),
            $this->token,
        );

        return new Content(
            markdown: 'emails.account-activation',
            with: [
                'userName' => $this->user->name,
                'roleLine' => $this->roleLine,
                'activationUrl' => $activationUrl,
            ],
        );
    }
}
