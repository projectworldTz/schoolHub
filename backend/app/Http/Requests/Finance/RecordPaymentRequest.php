<?php

namespace App\Http\Requests\Finance;

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
                    if ($invoice && bccomp((string) $value, (string) $invoice->balance, 2) > 0) {
                        $fail('The amount may not exceed the outstanding balance of '.number_format((float) $invoice->balance, 2).'.');
                    }
                },
            ],
            'method' => ['required', Rule::in(['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other'])],
            'provider' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'paid_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
