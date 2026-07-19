<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class LessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('lms.manage');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:20000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
