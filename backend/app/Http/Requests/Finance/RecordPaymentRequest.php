<?php

namespace App\Http\Requests\Finance;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('finance.manage');
    }

    public function rules(): array
    {
        $invoice = $this->route('invoice');

        return [
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                function ($attribute, $value, $fail) use ($invoice) {
                    if (! $invoice) {
                        return;
                    }

                    $categoryId = $this->input('fee_category_id');
                    $cap = $categoryId ? $this->categoryRemaining($invoice, $categoryId) : (string) $invoice->balance;
                    $label = $categoryId ? 'this fee category\'s' : 'the invoice\'s';

                    if (bccomp((string) $value, $cap, 2) > 0) {
                        $fail("The amount may not exceed {$label} outstanding balance of ".number_format((float) $cap, 2).'.');
                    }
                },
            ],
            'fee_category_id' => ['nullable', 'uuid', 'exists:fee_categories,id'],
            'method' => ['required', Rule::in(['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other'])],
            'provider' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'paid_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * A category's outstanding balance isn't a stored column — it's the sum
     * of this invoice's line items whose fee structure belongs to that
     * category, minus payments already recorded against that category.
     * withTrashed() on feeStructure matters because a fee structure can be
     * deleted (e.g. a category retired) after invoices referencing it
     * already exist — same pattern FeeExclusionService uses when it
     * recalculates invoices by category.
     */
    protected function categoryRemaining(Invoice $invoice, string $categoryId): string
    {
        $categoryTotal = $invoice->items()
            ->with(['feeStructure' => fn ($q) => $q->withTrashed()])
            ->get()
            ->filter(fn ($item) => $item->feeStructure?->fee_category_id === $categoryId)
            ->sum('amount');

        $categoryPaid = $invoice->payments()->where('fee_category_id', $categoryId)->sum('amount');

        return bcsub((string) $categoryTotal, (string) $categoryPaid, 2);
    }
}
