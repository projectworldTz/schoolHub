<?php

namespace App\Policies;

use App\Models\School;
use App\Models\User;

class SchoolPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('Super Admin');
    }

    public function view(User $user, School $school): bool
    {
        return $user->hasRole('Super Admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Super Admin');
    }

    public function update(User $user, School $school): bool
    {
        return $user->hasRole('Super Admin');
    }

    public function delete(User $user, School $school): bool
    {
        return $user->hasRole('Super Admin');
    }

    public function approve(User $user, School $school): bool
    {
        return $user->hasRole('Super Admin');
    }

    public function suspend(User $user, School $school): bool
    {
        return $user->hasRole('Super Admin');
    }
}
