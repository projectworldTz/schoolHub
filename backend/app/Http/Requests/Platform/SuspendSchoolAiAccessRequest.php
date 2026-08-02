<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class SuspendSchoolAiAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageAi', $this->route('school'));
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
