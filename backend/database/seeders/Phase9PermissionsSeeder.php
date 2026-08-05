<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permission introduced by the Website Builder module — the "who on staff
 * can touch it" axis, orthogonal to the school-level website_enabled grant
 * (see App\Services\WebsiteBuilder\WebsitePremiumAccessService). Granted to
 * the same roles as school-settings.manage: this is a settings-level
 * capability, not something every staff member needs the way
 * ai-assistant.use is.
 */
class Phase9PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'website-builder.manage',
    ];

    protected const ROLES = [
        'School Owner',
        'Principal',
        'Head Teacher',
        'Vice Chancellor',
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLES as $role) {
            Role::findByName($role, 'web')->givePermissionTo(self::PERMISSIONS);
        }
    }
}
