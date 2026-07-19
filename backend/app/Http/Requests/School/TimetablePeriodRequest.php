<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TimetablePeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('timetable.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('timetable_periods', 'name')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('timetable_period')),
            ],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_break' => ['sometimes', 'boolean'],
        ];
    }
}
