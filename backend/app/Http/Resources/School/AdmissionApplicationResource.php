<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AdmissionApplication */
class AdmissionApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'applying_for_class_id' => $this->applying_for_class_id,
            'applying_for_class_name' => $this->whenLoaded('applyingForClass', fn () => $this->applyingForClass->name),
            'branch_name' => $this->whenLoaded('applyingForClass', fn () => $this->applyingForClass->relationLoaded('branch') ? $this->applyingForClass->branch?->name : null),
            'applicant_first_name' => $this->applicant_first_name,
            'applicant_last_name' => $this->applicant_last_name,
            'date_of_birth' => $this->date_of_birth,
            'gender' => $this->gender,
            'guardian_name' => $this->guardian_name,
            'guardian_phone' => $this->guardian_phone,
            'guardian_email' => $this->guardian_email,
            'status' => $this->status,
            'notes' => $this->notes,
            'student_id' => $this->student_id,
            'reviewed_by' => $this->reviewed_by,
            'reviewer_name' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewed_at' => $this->reviewed_at,
            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at,
        ];
    }
}
