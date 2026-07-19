<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('announcements.manage');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'audience' => ['required', Rule::in(['school', 'class', 'role'])],
            'school_class_id' => ['required_if:audience,class', 'nullable', 'uuid', 'exists:school_classes,id'],
            'role' => ['required_if:audience,role', 'nullable', 'string', 'max:100'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
