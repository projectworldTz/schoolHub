<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTeacherSubjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('staff.manage');
    }

    public function rules(): array
    {
        return [
            'subject_ids' => ['present', 'array'],
            'subject_ids.*' => [
                'uuid',
                Rule::exists('subjects', 'id')->where('school_id', $this->user()->school_id),
            ],
        ];
    }
}
