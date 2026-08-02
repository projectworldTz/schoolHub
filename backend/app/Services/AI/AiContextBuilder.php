<?php

namespace App\Services\AI;

use App\Models\School;
use App\Models\Term;
use App\Models\User;

/**
 * The small, fixed set of context every AI call (routing and final-answer)
 * shares — deliberately excludes anything not needed: no credentials, no
 * full user/table dumps, no other school's data. Queries here rely on the
 * request's already-established tenant context (ResolveTenantFromUser),
 * same as every other school-scoped query in this app.
 */
class AiContextBuilder
{
    /** @return array<string, mixed> */
    public function build(User $user, School $school): array
    {
        $currentTerm = Term::where('is_current', true)->first()
            ?? Term::orderByDesc('start_date')->first();

        return [
            'user' => [
                'name' => $user->name,
                'role' => $user->roles->pluck('name')->first() ?? 'staff member',
            ],
            'school' => [
                'name' => $school->name,
                'timezone' => $school->timezone ?? 'UTC',
                'current_academic_year' => $currentTerm?->academicYear?->name,
                'current_term' => $currentTerm?->name,
            ],
        ];
    }
}
