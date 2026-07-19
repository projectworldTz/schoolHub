<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('subjects.manage');
    }

    public function rules(): array
    {
        return [
            'department_id' => [
                'nullable', 'uuid',
                Rule::exists('departments', 'id')->where('school_id', $this->user()->school_id),
            ],
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('subjects', 'name')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('subject')),
            ],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
