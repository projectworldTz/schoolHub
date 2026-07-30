<x-mail::message>
# Welcome to SchoolHub Africa

Hi {{ $userName }},

An account has been created for you as {{ $roleLine }} on SchoolHub Africa.

To get started, set your password using the link below:

<x-mail::button :url="$activationUrl">
Activate your account
</x-mail::button>

This link can only be used once and will expire after a while — if it's expired by the time you click it, ask your school or platform administrator to resend the invitation.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
