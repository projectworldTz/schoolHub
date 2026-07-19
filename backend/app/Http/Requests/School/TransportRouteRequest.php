<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class TransportRouteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('transport.manage');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'vehicle_registration' => ['nullable', 'string', 'max:50'],
            'driver_name' => ['nullable', 'string', 'max:255'],
            'driver_phone' => ['nullable', 'string', 'max:30'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
