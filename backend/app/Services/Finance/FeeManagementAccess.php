<?php

namespace App\Services\Finance;

use App\Services\School\SchoolFeatureAccess;

class FeeManagementAccess
{
    public static function enabled(): bool
    {
        return SchoolFeatureAccess::enabled('fee_management');
    }

    public static function ensureEnabled(): void
    {
        SchoolFeatureAccess::ensureEnabled('fee_management');
    }
}
