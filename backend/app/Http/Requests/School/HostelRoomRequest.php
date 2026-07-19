<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class HostelRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('hostel.manage');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:boys,girls,mixed'],
            'capacity' => ['required', 'integer', 'min:1'],
        ];
    }
}
