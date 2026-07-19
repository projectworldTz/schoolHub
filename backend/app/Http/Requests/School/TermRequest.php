<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TermRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('school-settings.manage');
    }

    public function rules(): array
    {
        // store() binds {academic_year} from the nested route; update()
        // (shallow route) only has {term}, so fall back to its own parent.
        $academicYearId = $this->route('academic_year')?->id
            ?? $this->route('term')?->academic_year_id;

        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('terms', 'name')
                    ->where('academic_year_id', $academicYearId)
                    ->ignore($this->route('term')),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }
}
