<?php

namespace App\Services\Finance;

use App\Models\FeeStructure;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    /**
     * One invoice per actively-enrolled student in the class, with one
     * invoice_item per selected fee structure — same
     * "auto-generate-per-enrolled-student" pattern as homework/exams.
     *
     * Guards against both halves of an "empty" invoice run: the request's
     * fee_structure_ids already pass a `min:1`/`exists` check, but those IDs
     * could still resolve to zero real FeeStructure rows (e.g. stale IDs
     * from a different class/year), and a class can simply have no actively
     * enrolled students. Either would otherwise silently create invoices
     * with a zero total and no line items — or nothing at all — with no
     * feedback that the "generate" action didn't do what was asked.
     *
     * @return array<Invoice>
     */
    public function generateForClass(array $attributes): array
    {
        $feeStructures = FeeStructure::whereIn('id', $attributes['fee_structure_ids'])->get();

        if ($feeStructures->isEmpty()) {
            throw ValidationException::withMessages([
                'fee_structure_ids' => 'None of the selected fee structures could be found — nothing to invoice.',
            ]);
        }

        $studentIds = StudentEnrollment::query()
            ->where('academic_year_id', $attributes['academic_year_id'])
            ->where('school_class_id', $attributes['school_class_id'])
            ->where('status', 'active')
            ->pluck('student_id');

        if ($studentIds->isEmpty()) {
            throw ValidationException::withMessages([
                'school_class_id' => 'This class has no actively enrolled students to invoice.',
            ]);
        }

        return DB::transaction(function () use ($attributes, $feeStructures, $studentIds) {
            $invoices = [];

            foreach ($studentIds as $studentId) {
                $invoice = Invoice::create([
                    'student_id' => $studentId,
                    'academic_year_id' => $attributes['academic_year_id'],
                    'term_id' => $attributes['term_id'] ?? null,
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'total_amount' => $feeStructures->sum('amount'),
                    'due_date' => $attributes['due_date'] ?? null,
                ]);

                foreach ($feeStructures as $feeStructure) {
                    $invoice->items()->create([
                        'fee_structure_id' => $feeStructure->id,
                        'description' => $feeStructure->feeCategory->name,
                        'amount' => $feeStructure->amount,
                    ]);
                }

                $invoices[] = $invoice;
            }

            return $invoices;
        });
    }

    public function generateInvoiceNumber(): string
    {
        return 'INV-'.now()->format('y').'-'.strtoupper(Str::random(6));
    }

    public function recordPayment(Invoice $invoice, array $data, ?string $receivedBy): Payment
    {
        return DB::transaction(function () use ($invoice, $data, $receivedBy) {
            $payment = $invoice->payments()->create([
                'student_id' => $invoice->student_id,
                'amount' => $data['amount'],
                'method' => $data['method'],
                'provider' => $data['provider'] ?? null,
                'reference' => $data['reference'] ?? null,
                'paid_at' => $data['paid_at'],
                'received_by' => $receivedBy,
                'notes' => $data['notes'] ?? null,
            ]);

            $invoice->amount_paid = bcadd((string) $invoice->amount_paid, (string) $data['amount'], 2);
            $invoice->status = $this->computeStatus($invoice);
            $invoice->save();

            return $payment;
        });
    }

    protected function computeStatus(Invoice $invoice): string
    {
        if (bccomp((string) $invoice->amount_paid, (string) $invoice->total_amount, 2) >= 0) {
            return 'paid';
        }

        if (bccomp((string) $invoice->amount_paid, '0', 2) > 0) {
            return 'partial';
        }

        if ($invoice->due_date && $invoice->due_date->isPast()) {
            return 'overdue';
        }

        return 'unpaid';
    }
}
