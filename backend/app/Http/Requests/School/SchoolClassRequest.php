<?php

namespace App\Http\Requests\School;

use App\Support\Tenancy\Tenant;
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
                    ->where('school_id', Tenant::id())
                    ->withoutTrashed()
                    ->ignore($this->route('class')),
            ],
            'level' => ['required', 'integer', 'min:0', 'max:65535'],
            'duration_years' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'branch_id' => [
                'nullable', 'uuid',
                Rule::exists('branches', 'id')->where('school_id', Tenant::id()),
            ],
        ];
    }
}
