<?php

namespace App\Http\Resources;

use App\Models\School;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'has_placeholder_email' => $this->has_placeholder_email,
            // Only set on the in-memory instance returned right after
            // store() creates a placeholder-email account — a plain
            // database re-fetch (index, show, update) never has this
            // attribute, same pattern as School Owner's temporary_password
            // in Platform\SchoolResource.
            'temporary_password' => $this->temporary_password ?? null,
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            'acting_school' => $this->when($this->hasRole('Super Admin'), fn () => $this->actingSchool($request)),
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Which school (if any) a Super Admin has currently "entered" — see
     * Platform\SchoolController::enter(). Read straight from the session
     * rather than Tenant::id(), since a non-Super-Admin's Tenant::id() is
     * their own school and has nothing to do with this field.
     */
    protected function actingSchool(Request $request): ?array
    {
        if (! $request->hasSession()) {
            return null;
        }

        $schoolId = $request->session()->get('platform_acting_school_id');

        if (! $schoolId) {
            return null;
        }

        return Tenant::runAsPlatform(
            fn () => School::query()->select('id', 'name')->find($schoolId)?->only(['id', 'name'])
        );
    }
}
