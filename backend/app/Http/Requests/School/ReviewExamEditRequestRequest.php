<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewExamEditRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('exams.manage');
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
        ];
    }
}
