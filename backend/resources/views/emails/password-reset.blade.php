<x-mail::message>
# Password reset request

Hi {{ $userName }},

We received a request to reset your {{ config('app.name') }} password. Click the button below to choose a new one.

<x-mail::button :url="$resetUrl">
Reset your password
</x-mail::button>

This link can only be used once and will expire after a while. If you didn't request this, you can safely ignore this email — your password will not be changed.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
