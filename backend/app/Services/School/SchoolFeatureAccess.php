<?php

namespace App\Services\School;

use App\Models\School;
use App\Support\Tenancy\Tenant;

class SchoolFeatureAccess
{
    public const FEATURES = [
        'fee_management' => 'Fee Management',
        'library' => 'Library',
        'hostel' => 'Hostel',
        'transport' => 'Transport',
        'cafeteria' => 'Cafeteria',
        'clinic' => 'Clinic',
        'inventory' => 'Inventory',
    ];

    public static function enabled(string $feature): bool
    {
        return isset(self::FEATURES[$feature]) && Tenant::check()
            && (bool) School::find(Tenant::id())?->getAttribute($feature.'_enabled');
    }

    public static function ensureEnabled(string $feature): void
    {
        abort_unless(isset(self::FEATURES[$feature]), 404);
        abort_unless(self::enabled($feature), 403, 'SchoolHub '.self::FEATURES[$feature].' is not enabled for this school.');
    }

    public static function states(?School $school): array
    {
        $states = [];
        foreach (self::FEATURES as $feature => $label) {
            $states[$feature.'_enabled'] = (bool) $school?->getAttribute($feature.'_enabled');
        }

        return $states;
    }
}
