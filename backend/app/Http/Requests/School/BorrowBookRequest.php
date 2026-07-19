<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class BorrowBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('library.manage');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'borrowed_at' => ['nullable', 'date'],
            'due_date' => ['required', 'date'],
        ];
    }
}
