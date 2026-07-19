<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('school-settings.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('departments', 'name')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('department')),
            ],
            'code' => ['nullable', 'string', 'max:50'],
            'head_user_id' => [
                'nullable', 'uuid',
                Rule::exists('users', 'id')->where('school_id', $this->user()->school_id),
            ],
        ];
    }
}
