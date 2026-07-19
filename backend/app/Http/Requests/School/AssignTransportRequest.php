<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class AssignTransportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('transport.manage');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'transport_route_id' => ['required', 'uuid', 'exists:transport_routes,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'pickup_point' => ['nullable', 'string', 'max:255'],
        ];
    }
}
