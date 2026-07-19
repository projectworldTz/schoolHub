<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('classes.manage');
    }

    public function rules(): array
    {
        return [
            'branch_id' => [
                'nullable', 'uuid',
                Rule::exists('branches', 'id')->where('school_id', $this->user()->school_id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'type' => ['sometimes', 'string', 'max:50'],
        ];
    }
}
