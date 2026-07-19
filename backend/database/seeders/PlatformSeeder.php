<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates the first Super Admin account so there's a way to log into the
 * Platform layer at all. Credentials are overridable via env for anything
 * beyond local dev — never rely on the fallback password outside local.
 */
class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => env('PLATFORM_ADMIN_EMAIL', 'admin@schoolhub.africa')],
            [
                'school_id' => null,
                'name' => env('PLATFORM_ADMIN_NAME', 'Platform Super Admin'),
                'password' => Hash::make(env('PLATFORM_ADMIN_PASSWORD', 'password')),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        if (! $user->hasRole('Super Admin')) {
            $user->assignRole('Super Admin');
        }
    }
}
