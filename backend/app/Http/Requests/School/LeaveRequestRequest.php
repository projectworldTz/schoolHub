<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

/** Any authenticated staff member may submit their own leave request. */
class LeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
