<?php

namespace App\Http\Resources\Platform;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\School */
class SchoolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'custom_domain' => $this->custom_domain,
            'type' => $this->type,
            'status' => $this->status,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'country' => $this->country,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'logo_path' => $this->logo_path,
            'subscription_plan' => $this->subscription_plan,
            'license_expires_at' => $this->license_expires_at,
            'approved_at' => $this->approved_at,
            'suspended_at' => $this->suspended_at,
            'suspension_reason' => $this->suspension_reason,
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'name' => $this->owner->name,
                'email' => $this->owner->email,
                // Only set on the in-memory instance returned by
                // SchoolService::create() — a plain database re-fetch (index,
                // show, update) never has this attribute, so it only ever
                // appears in the one response right after creation.
                'temporary_password' => $this->owner->temporary_password ?? null,
            ] : null),
            'users_count' => $this->whenCounted('users'),
            'students_count' => $this->whenCounted('students'),
            'teachers_count' => $this->whenCounted('teachers_count'),
            'parents_count' => $this->whenCounted('parents_count'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
