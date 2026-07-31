<?php

namespace App\Mail\Concerns;

use App\Models\School;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Per-school branding for system mail, without per-school domain setup: the
 * envelope From address stays the one verified sender Brevo actually lets
 * this app send as, but the display NAME carries the school's name, and
 * Reply-To points at the school's own contact address (if it has one) so a
 * parent/teacher's reply reaches the school, not this app. True
 * custom-domain sending (noreply@theschool's-own-domain) would need each
 * school to add SPF/DKIM records with the ESP — deliberately not done here.
 */
trait BrandsFromSchool
{
    protected function schoolEnvelope(?School $school, string $subject): Envelope
    {
        return new Envelope(
            subject: $subject,
            from: $school
                ? new Address(config('mail.from.address'), "{$school->name} (via ".config('app.name').")")
                : null,
            replyTo: ($school && $school->email)
                ? [new Address($school->email, $school->name)]
                : [],
        );
    }
}
