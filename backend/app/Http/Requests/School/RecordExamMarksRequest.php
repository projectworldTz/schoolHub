<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class RecordExamMarksRequest extends FormRequest
{
    /**
     * exam-marks.record is held by every Teacher school-wide — without the
     * canAccessClass check, any teacher could record marks for any class's
     * exam-subject just by knowing/guessing its id.
     */
    public function authorize(): bool
    {
        if (! $this->user()->can('exam-marks.record')) {
            return false;
        }

        $examSubject = $this->route('examSubject');

        return ! $examSubject || $this->user()->canAccessClass($examSubject->school_class_id);
    }

    public function rules(): array
    {
        return [
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'uuid', 'exists:students,id'],
            'records.*.marks_obtained' => ['nullable', 'numeric', 'min:0'],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
