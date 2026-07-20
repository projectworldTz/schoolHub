<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Permissions introduced by ROADMAP.md Phase 5 (Fee Management, Payroll,
 * Expenses). Kept as three separate permissions rather than one
 * 'finance.manage' because they're staffed differently in practice — HR
 * runs payroll, Accountant/Bursar run fees and expenses, and a school
 * shouldn't have to grant someone all three just to do one.
 */
class Phase5PermissionsSeeder extends Seeder
{
    protected const PERMISSIONS = [
        'finance.manage',
        'payroll.manage',
        'expenses.manage',
    ];

    protected const ROLE_PERMISSIONS = [
        'School Owner' => ['finance.manage', 'payroll.manage', 'expenses.manage'],
        'Principal' => ['finance.manage', 'expenses.manage'],
        'Accountant' => ['finance.manage', 'payroll.manage', 'expenses.manage'],
        'Bursar' => ['finance.manage', 'payroll.manage', 'expenses.manage'],
        'HR Officer' => ['payroll.manage'],

        'Head Teacher' => ['finance.manage', 'expenses.manage'],
        'Vice Chancellor' => ['finance.manage', 'expenses.manage'],
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
