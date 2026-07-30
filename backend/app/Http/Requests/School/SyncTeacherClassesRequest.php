<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTeacherClassesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('staff.manage');
    }

    public function rules(): array
    {
        return [
            'class_ids' => ['present', 'array'],
            'class_ids.*' => [
                'uuid',
                Rule::exists('school_classes', 'id')->where('school_id', $this->user()->school_id),
            ],
        ];
    }
}
