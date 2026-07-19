<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Guardian */
class GuardianResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'occupation' => $this->occupation,
            'address' => $this->address,
            'has_portal_access' => (bool) $this->user_id,
            'relationship' => $this->whenPivotLoaded('student_guardian', fn () => $this->pivot->relationship),
            'is_primary' => $this->whenPivotLoaded('student_guardian', fn () => (bool) $this->pivot->is_primary),
            'is_emergency_contact' => $this->whenPivotLoaded('student_guardian', fn () => (bool) $this->pivot->is_emergency_contact),
        ];
    }
}
