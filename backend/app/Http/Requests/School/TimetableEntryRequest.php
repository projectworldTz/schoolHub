<?php

namespace App\Http\Requests\School;

use App\Services\School\TimetableEntryService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class TimetableEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('timetable.manage');
    }

    public function rules(): array
    {
        return [
            'school_class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'stream_id' => ['nullable', 'uuid', 'exists:streams,id'],
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'teacher_id' => ['required', 'uuid', 'exists:users,id'],
            'room_id' => ['nullable', 'uuid', 'exists:rooms,id'],
            'timetable_period_id' => ['required', 'uuid', 'exists:timetable_periods,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'day_of_week' => ['required', Rule::in(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $service = app(TimetableEntryService::class);
            $attrs = $this->validated();
            $ignoreId = $this->route('timetable_entry')?->id;

            if ($service->findClassConflict($attrs, $ignoreId)) {
                $validator->errors()->add('school_class_id', 'This class already has a lesson in that slot.');
            }

            if ($service->findTeacherConflict($attrs, $ignoreId)) {
                $validator->errors()->add('teacher_id', 'This teacher already has a lesson in that slot.');
            }

            if ($service->findRoomConflict($attrs, $ignoreId)) {
                $validator->errors()->add('room_id', 'This room is already booked in that slot.');
            }
        });
    }
}
