<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class RefineExamPaperRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exam-marks.record') || $this->user()->can('exams.manage');
    }

    public function rules(): array
    {
        return [
            'instruction' => ['required', 'string', 'max:1000'],
        ];
    }
}
