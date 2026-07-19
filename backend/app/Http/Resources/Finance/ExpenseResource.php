<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Expense */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expense_category_id' => $this->expense_category_id,
            'category_name' => $this->whenLoaded('category', fn () => $this->category->name),
            'amount' => $this->amount,
            'description' => $this->description,
            'expense_date' => $this->expense_date?->toDateString(),
            'recorded_by_name' => $this->whenLoaded('recordedBy', fn () => $this->recordedBy?->name),
        ];
    }
}
