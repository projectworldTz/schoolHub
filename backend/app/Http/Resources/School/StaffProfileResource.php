<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StaffProfile */
class StaffProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->whenLoaded('user', fn () => $this->user->name),
            'email' => $this->whenLoaded('user', fn () => $this->user->email),
            'roles' => $this->whenLoaded('user', fn () => $this->user->getRoleNames()),
            'department_id' => $this->department_id,
            'department_name' => $this->whenLoaded('department', fn () => $this->department?->name),
            'branch_id' => $this->branch_id,
            'branch_name' => $this->whenLoaded('branch', fn () => $this->branch?->name),
            'staff_number' => $this->staff_number,
            'job_title' => $this->job_title,
            'employment_type' => $this->employment_type,
            'hire_date' => $this->hire_date,
            'termination_date' => $this->termination_date,
            'bio' => $this->bio,
            'subjects_taught' => $this->when(
                $this->relationLoaded('user') && $this->user->relationLoaded('subjectsTaught'),
                fn () => SubjectResource::collection($this->user->subjectsTaught)
            ),
            'created_at' => $this->created_at,
        ];
    }
}
