<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Budget */
class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expense_category_id' => $this->expense_category_id,
            'category_name' => $this->whenLoaded('expenseCategory', fn () => $this->expenseCategory->name),
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'amount' => $this->amount,
            'notes' => $this->notes,
        ];
    }
}
