<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class SuspendSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('suspend', $this->route('school'));
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
