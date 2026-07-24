<?php

namespace App\Http\Requests\School;

use App\Models\ExamEditRequest;
use App\Models\ExamSubject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** The grading teacher requests their own locked gradebook be reopened. */
class ExamEditRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exam-marks.record');
    }

    public function rules(): array
    {
        return [
            'exam_subject_id' => [
                'required', 'uuid',
                Rule::exists('exam_subjects', 'id')->where('school_id', $this->user()->school_id),
            ],
            'reason' => ['required', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $examSubject = ExamSubject::find($this->input('exam_subject_id'));

            if (! $examSubject) {
                return;
            }

            if (! $examSubject->isLocked()) {
                $validator->errors()->add('exam_subject_id', 'This gradebook is not locked — no edit request is needed.');

                return;
            }

            $alreadyPending = ExamEditRequest::where('exam_subject_id', $examSubject->id)
                ->where('requested_by', $this->user()->id)
                ->where('status', 'pending')
                ->exists();

            if ($alreadyPending) {
                $validator->errors()->add('exam_subject_id', 'You already have a pending edit request for this gradebook.');
            }
        });
    }
}
