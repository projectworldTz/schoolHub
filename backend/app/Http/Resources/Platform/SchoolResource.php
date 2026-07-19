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
            'trial_ends_at' => $this->trial_ends_at,
            'approved_at' => $this->approved_at,
            'suspended_at' => $this->suspended_at,
            'suspension_reason' => $this->suspension_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
