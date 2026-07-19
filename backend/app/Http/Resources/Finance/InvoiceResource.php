<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Invoice */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'admission_number' => $this->whenLoaded('student', fn () => $this->student->admission_number),
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->whenLoaded('academicYear', fn () => $this->academicYear->name),
            'term_id' => $this->term_id,
            'term_name' => $this->whenLoaded('term', fn () => $this->term?->name),
            'total_amount' => $this->total_amount,
            'amount_paid' => $this->amount_paid,
            'balance' => $this->balance,
            'status' => $this->status,
            'due_date' => $this->due_date?->toDateString(),
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at,
        ];
    }
}
