<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Intentionally NOT using WithoutModelEvents: HasUuids generates
     * primary keys via the Eloquent `creating` event, and BelongsToSchool
     * relies on it too — muting model events here would silently break
     * both.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            PlatformSeeder::class,
            Phase1PermissionsSeeder::class,
            Phase2PermissionsSeeder::class,
            Phase3PermissionsSeeder::class,
            Phase4PermissionsSeeder::class,
            Phase5PermissionsSeeder::class,
            Phase6PermissionsSeeder::class,
            Phase7PermissionsSeeder::class,
            Phase8PermissionsSeeder::class,
        ]);
    }
}
