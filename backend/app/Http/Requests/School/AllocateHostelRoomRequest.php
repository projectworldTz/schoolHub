<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class AllocateHostelRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('hostel.manage');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'hostel_room_id' => ['required', 'uuid', 'exists:hostel_rooms,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'allocated_at' => ['nullable', 'date'],
        ];
    }
}
