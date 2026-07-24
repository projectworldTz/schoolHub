<?php

namespace App\Http\Resources\School;

use App\Models\ExamEditRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ExamSubject */
class ExamSubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $myEditRequest = $request->user()
            ? ExamEditRequest::where('exam_subject_id', $this->id)
                ->where('requested_by', $request->user()->id)
                ->latest()
                ->first()
            : null;

        return [
            'id' => $this->id,
            'exam_id' => $this->exam_id,
            'school_class_id' => $this->school_class_id,
            'school_class_name' => $this->whenLoaded('schoolClass', fn () => $this->schoolClass->name),
            'subject_id' => $this->subject_id,
            'subject_name' => $this->whenLoaded('subject', fn () => $this->subject->name),
            'max_marks' => $this->max_marks,
            'pass_marks' => $this->pass_marks,
            'exam_date' => $this->exam_date?->toDateString(),
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'edit_locked_at' => $this->editLockedAt()?->toIso8601String(),
            'is_locked' => $this->isLocked(),
            'my_edit_request' => $myEditRequest ? [
                'id' => $myEditRequest->id,
                'status' => $myEditRequest->status,
                'reason' => $myEditRequest->reason,
                'unlocked_until' => $myEditRequest->unlocked_until?->toIso8601String(),
                'created_at' => $myEditRequest->created_at?->toIso8601String(),
            ] : null,
            'results' => ExamResultResource::collection($this->whenLoaded('results')),
        ];
    }
}
