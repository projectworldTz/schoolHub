<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 6 (Facilities & Logistics:
 * Library, Hostel, Transport, Inventory, Clinic, Cafeteria). Kept as six
 * separate permissions rather than one 'facilities.manage' because each is
 * staffed by a different specialist role in practice (Librarian, Hostel
 * Warden, Transport Officer, Store Keeper, Nurse) and a school shouldn't
 * have to grant someone all six just to do one.
 */
class Phase6PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'library.manage',
        'hostel.manage',
        'transport.manage',
        'inventory.manage',
        'clinic.manage',
        'cafeteria.manage',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['library.manage', 'hostel.manage', 'transport.manage', 'inventory.manage', 'clinic.manage', 'cafeteria.manage'],
        'Principal' => ['library.manage', 'hostel.manage', 'transport.manage', 'inventory.manage', 'clinic.manage', 'cafeteria.manage'],
        'Librarian' => ['library.manage'],
        'Hostel Warden' => ['hostel.manage'],
        'Transport Officer' => ['transport.manage'],
        'Store Keeper' => ['inventory.manage', 'cafeteria.manage'],
        'Nurse' => ['clinic.manage'],

        'Head Teacher' => ['library.manage', 'hostel.manage', 'transport.manage', 'inventory.manage', 'clinic.manage', 'cafeteria.manage'],
        'Vice Chancellor' => ['library.manage', 'hostel.manage', 'transport.manage', 'inventory.manage', 'clinic.manage', 'cafeteria.manage'],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            Role::findByName($role, 'web')->givePermissionTo($permissions);
        }
    }
}
