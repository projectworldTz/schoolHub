<?php

namespace App\Services\Finance;

use App\Models\FeeStructure;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeExclusion;
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
     * A student individually excluded (see StudentFeeExclusion) from every
     * selected fee structure's category is skipped rather than given a
     * blank invoice — same "no empty records" rule, just per-student instead
     * of per-class.
     *
     * A fee structure marked pay_once (e.g. a one-time registration/
     * admission fee) is only ever billed to a given student once, across
     * every prior invoice — not just within the current academic year/term
     * — so re-running generation in a later term never re-bills it. This is
     * a real state check against invoice_items (see $alreadyBilledPayOnce
     * below), not a flag on the student, since a fee structure can be
     * flipped between recurring and pay_once after some students already
     * have it on an invoice.
     *
     * @return array{invoices: array<Invoice>, skipped_students: array<array{id: string, name: string}>}
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

        $excludedCategoryIdsByStudent = StudentFeeExclusion::query()
            ->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $attributes['academic_year_id'])
            ->get(['student_id', 'fee_category_id'])
            ->groupBy('student_id')
            ->map(fn ($rows) => $rows->pluck('fee_category_id')->all());

        $payOnceStructureIds = $feeStructures->where('pay_once', true)->pluck('id');

        $alreadyBilledPayOnce = $payOnceStructureIds->isEmpty()
            ? collect()
            : InvoiceItem::query()
                ->whereIn('fee_structure_id', $payOnceStructureIds)
                ->whereHas('invoice', fn ($q) => $q->whereIn('student_id', $studentIds))
                ->with('invoice:id,student_id')
                ->get()
                ->map(fn (InvoiceItem $item) => "{$item->invoice->student_id}:{$item->fee_structure_id}");

        return DB::transaction(function () use ($attributes, $feeStructures, $studentIds, $excludedCategoryIdsByStudent, $alreadyBilledPayOnce) {
            $invoices = [];
            $skipped = [];

            foreach ($studentIds as $studentId) {
                $excludedCategoryIds = $excludedCategoryIdsByStudent->get($studentId, []);

                $applicableStructures = $excludedCategoryIds === []
                    ? $feeStructures
                    : $feeStructures->reject(fn (FeeStructure $fs) => in_array($fs->fee_category_id, $excludedCategoryIds, true));

                $applicableStructures = $applicableStructures->reject(
                    fn (FeeStructure $fs) => $fs->pay_once && $alreadyBilledPayOnce->contains("{$studentId}:{$fs->id}")
                );

                if ($applicableStructures->isEmpty()) {
                    $student = Student::find($studentId);
                    $skipped[] = ['id' => $studentId, 'name' => $student?->full_name ?? $studentId];

                    continue;
                }

                $invoice = Invoice::create([
                    'student_id' => $studentId,
                    'academic_year_id' => $attributes['academic_year_id'],
                    'term_id' => $attributes['term_id'] ?? null,
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'total_amount' => $applicableStructures->sum('amount'),
                    'due_date' => $attributes['due_date'] ?? null,
                ]);

                foreach ($applicableStructures as $feeStructure) {
                    $invoice->items()->create([
                        'fee_structure_id' => $feeStructure->id,
                        'description' => $feeStructure->feeCategory->name,
                        'amount' => $feeStructure->amount,
                    ]);
                }

                $invoices[] = $invoice;
            }

            return ['invoices' => $invoices, 'skipped_students' => $skipped];
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
                'fee_category_id' => $data['fee_category_id'] ?? null,
                'amount' => $data['amount'],
                'method' => $data['method'],
                'provider' => $data['provider'] ?? null,
                'reference' => $data['reference'] ?? null,
                'paid_at' => $data['paid_at'],
                'received_by' => $receivedBy,
                'notes' => $data['notes'] ?? null,
            ]);

            $invoice->amount_paid = bcadd((string) $invoice->amount_paid, (string) $data['amount'], 2);
            $invoice->status = static::computeStatus($invoice);
            $invoice->save();

            return $payment;
        });
    }

    /**
     * Shared by recordPayment() here and FeeExclusionService's recalculation
     * — both mutate amount_paid/total_amount and need the exact same
     * paid/partial/overdue/unpaid rule applied afterwards.
     */
    public static function computeStatus(Invoice $invoice): string
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
