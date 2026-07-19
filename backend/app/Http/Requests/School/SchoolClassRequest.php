<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('classes.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('school_classes', 'name')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('class')),
            ],
            'level' => ['required', 'integer', 'min:0', 'max:65535'],
            'branch_id' => [
                'nullable', 'uuid',
                Rule::exists('branches', 'id')->where('school_id', $this->user()->school_id),
            ],
        ];
    }
}
