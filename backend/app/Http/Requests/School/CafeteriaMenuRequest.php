<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class CafeteriaMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('cafeteria.manage');
    }

    public function rules(): array
    {
        return [
            'menu_date' => ['required', 'date'],
            'meal_type' => ['required', 'in:breakfast,lunch,dinner,snack'],
            'description' => ['required', 'string'],
        ];
    }
}
