<?php

namespace App\Http\Requests\School;

use App\Support\Tenancy\Tenant;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromotionCommitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('graduation.manage');
    }

    public function rules(): array
    {
        $schoolId = Tenant::id();

        return [
            'from_academic_year_id' => [
                'nullable', 'uuid',
                Rule::exists('academic_years', 'id')->where('school_id', $schoolId),
            ],
            'to_academic_year_id' => [
                'required', 'uuid',
                Rule::exists('academic_years', 'id')->where('school_id', $schoolId),
            ],
            'mode' => ['required', Rule::in(['automatic', 'manual'])],
            'decisions' => ['required', 'array', 'min:1'],
            'decisions.*.student_id' => [
                'required', 'uuid',
                Rule::exists('students', 'id')->where('school_id', $schoolId),
            ],
            'decisions.*.to_school_class_id' => [
                'nullable', 'uuid',
                Rule::exists('school_classes', 'id')->where('school_id', $schoolId),
            ],
            'decisions.*.graduate' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Each decision must be exactly one of "promote/repeat to this class" or
     * "graduate" — never both (ambiguous) and never neither (a decision
     * that does nothing shouldn't have been included at all).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('decisions', []) as $index => $decision) {
                $hasClass = ! empty($decision['to_school_class_id'] ?? null);
                $graduate = ! empty($decision['graduate'] ?? false);

                if ($hasClass === $graduate) {
                    $validator->errors()->add(
                        "decisions.{$index}",
                        'Each decision must specify exactly one of to_school_class_id or graduate.'
                    );
                }
            }
        });
    }
}
