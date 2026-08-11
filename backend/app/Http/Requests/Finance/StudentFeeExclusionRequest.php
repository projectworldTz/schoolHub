<?php

namespace App\Http\Requests\Finance;

use App\Models\FeeCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentFeeExclusionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('finance.manage');
    }

    public function rules(): array
    {
        return [
            'fee_category_id' => [
                'required', 'uuid', 'exists:fee_categories,id',
                function ($attribute, $value, $fail) {
                    $category = FeeCategory::find($value);

                    if ($category && ! $category->is_optional) {
                        $fail('Only optional fee categories can be excluded for a student — this one is mandatory.');
                    }
                },
                Rule::unique('student_fee_exclusions', 'fee_category_id')
                    ->where(fn ($query) => $query
                        ->where('student_id', $this->route('student')?->id)
                        ->where('academic_year_id', $this->input('academic_year_id'))
                        ->whereNull('deleted_at')),
            ],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
