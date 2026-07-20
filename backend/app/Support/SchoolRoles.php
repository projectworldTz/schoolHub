<?php

namespace App\Support;

/**
 * Which of the global Spatie roles a given school TYPE is offered when
 * managing its own staff. See config/school_roles.php for the actual
 * catalog and why 'vocational'/'other' fall back to 'college' here.
 */
class SchoolRoles
{
    public static function forType(?string $type): array
    {
        $catalog = config('school_roles');

        $typeRoles = match ($type) {
            'nursery', 'primary', 'secondary', 'college', 'university' => $catalog[$type],
            default => $catalog['college'],
        };

        return array_values(array_unique(array_merge($catalog['shared'], $typeRoles)));
    }
}
