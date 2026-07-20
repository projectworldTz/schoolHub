<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Roles available per school type
    |--------------------------------------------------------------------------
    |
    | Spatie roles are global rows (no per-tenant "teams" — see
    | App\Support\Tenancy\Tenant for why), so every role in
    | RolesAndPermissionsSeeder exists for every school regardless of type.
    | This is the presentation/validation layer on top of that: which of
    | those roles a given school type is actually offered when managing its
    | own staff (SchoolUserController::availableRoles(), and the roles.*
    | validation in Create/UpdateSchoolUserRequest). See App\Support\SchoolRoles.
    |
    | 'vocational' and 'other' intentionally fall back to the 'college'
    | catalog in App\Support\SchoolRoles::forType() rather than having their
    | own entry, since a vocational/technical college's leadership structure
    | mirrors a college's more closely than a secondary school's.
    */

    'shared' => [
        'School Owner',
        'Accountant',
        'Bursar',
        'HR Officer',
        'Librarian',
        'Hostel Warden',
        'Transport Officer',
        'Nurse',
        'Receptionist',
        'Store Keeper',
        'Security Officer',
    ],

    'nursery' => [
        'Head Teacher',
        'Teacher',
    ],

    'primary' => [
        'Head Teacher',
        'Deputy Head Teacher',
        'Academic Master',
        'Discipline Master',
        'Class Teacher',
        'Subject Teacher',
    ],

    'secondary' => [
        'Principal',
        'Second Master',
        'Academic Master',
        'Admissions Officer',
        'Class Teacher',
        'Subject Teacher',
    ],

    'college' => [
        'Principal',
        'Vice Principal',
        'Registrar',
        'Dean of Students',
        'Head of Department',
        'Lecturer',
        'Admissions Officer',
    ],

    'university' => [
        'Vice Chancellor',
        'Deputy Vice Chancellor',
        'Registrar',
        'Admissions Officer',
        'Dean of Students',
        'Head of Department',
        'Lecturer',
    ],

];
