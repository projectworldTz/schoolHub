<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Grade bands are edited as a whole set alongside their grading system
 * (a full replace on write) rather than through separate band endpoints —
 * a school's grade scale is small and always edited together.
 */
class GradingSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('subjects.manage');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('grading_systems', 'name')
                    ->where('school_id', $this->user()->school_id)
                    ->ignore($this->route('grading_system')),
            ],
            'is_default' => ['sometimes', 'boolean'],
            'grade_bands' => ['present', 'array'],
            'grade_bands.*.label' => ['required', 'string', 'max:10'],
            'grade_bands.*.min_score' => ['required', 'integer', 'min:0', 'max:100'],
            'grade_bands.*.max_score' => ['required', 'integer', 'min:0', 'max:100', 'gte:grade_bands.*.min_score'],
            'grade_bands.*.remark' => ['nullable', 'string', 'max:255'],
            'grade_bands.*.gpa' => ['nullable', 'numeric', 'min:0', 'max:5'],
        ];
    }
}
