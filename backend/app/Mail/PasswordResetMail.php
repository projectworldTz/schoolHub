<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent when someone with an existing account requests a password reset
 * (AuthController::forgotPassword()) — distinct from AccountActivationMail,
 * which is for a login that didn't exist yet; the "welcome, you've been set
 * up as..." copy there would be confusing to an existing user who simply
 * forgot their password.
 */
class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $token,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset your '.config('app.name').' password',
        );
    }

    public function content(): Content
    {
        $resetUrl = sprintf(
            '%s/reset-password?email=%s&token=%s',
            rtrim(config('app.frontend_url'), '/'),
            urlencode($this->user->email),
            $this->token,
        );

        return new Content(
            markdown: 'emails.password-reset',
            with: [
                'userName' => $this->user->name,
                'resetUrl' => $resetUrl,
            ],
        );
    }
}
