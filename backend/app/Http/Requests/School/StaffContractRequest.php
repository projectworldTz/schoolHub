<?php

namespace App\Http\Requests\School;

use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('staff.manage');
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required', 'uuid',
                Rule::exists('users', 'id')->where('school_id', Tenant::id()),
            ],
            'contract_type' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
