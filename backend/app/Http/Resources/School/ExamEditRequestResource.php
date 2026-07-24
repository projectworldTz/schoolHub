<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ExamEditRequest */
class ExamEditRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_subject_id' => $this->exam_subject_id,
            'exam_name' => $this->whenLoaded('examSubject', fn () => $this->examSubject->exam?->name),
            'school_class_name' => $this->whenLoaded('examSubject', fn () => $this->examSubject->schoolClass?->name),
            'subject_name' => $this->whenLoaded('examSubject', fn () => $this->examSubject->subject?->name),
            'requested_by' => $this->requested_by,
            'requested_by_name' => $this->whenLoaded('requestedBy', fn () => $this->requestedBy->name),
            'reason' => $this->reason,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewer_name' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'unlocked_until' => $this->unlocked_until?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
