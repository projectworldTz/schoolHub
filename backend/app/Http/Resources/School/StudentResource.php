<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Student */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'admission_number' => $this->admission_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'date_of_birth' => $this->date_of_birth,
            'gender' => $this->gender,
            'photo_path' => $this->photo_path,
            'blood_group' => $this->blood_group,
            'allergies' => $this->allergies,
            'medical_notes' => $this->medical_notes,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'previous_school_name' => $this->previous_school_name,
            'qr_code' => $this->qr_code,
            'status' => $this->status,
            'guardians' => GuardianResource::collection($this->whenLoaded('guardians')),
            'current_enrollment' => new StudentEnrollmentResource($this->whenLoaded('currentEnrollment')),
            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at,
        ];
    }
}
