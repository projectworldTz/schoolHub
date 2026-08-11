<?php

namespace App\Services\Finance;

use App\Models\AcademicYear;
use App\Models\FeeCategory;
use App\Models\Invoice;
use App\Models\Student;
use App\Models\StudentFeeExclusion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FeeExclusionService
{
    /**
     * Excludes a student from an optional fee category for an academic
     * year, then retroactively strips the matching line item from every
     * already-generated invoice of theirs in that year. Wrapped in one
     * transaction so a blocked recalculation (see recalculate() below)
     * rolls back the exclusion row too — never record an exclusion the
     * invoices don't actually reflect.
     *
     * @return array{exclusion: StudentFeeExclusion, adjusted_invoices: array<array{invoice_number: string, total_amount: string, balance: string}>}
     */
    public function exclude(Student $student, FeeCategory $feeCategory, AcademicYear $academicYear, ?string $reason, ?string $actorId): array
    {
        if (! $feeCategory->is_optional) {
            throw ValidationException::withMessages([
                'fee_category_id' => 'Only optional fee categories can be excluded for a student — this one is mandatory.',
            ]);
        }

        return DB::transaction(function () use ($student, $feeCategory, $academicYear, $reason, $actorId) {
            $exclusion = StudentFeeExclusion::create([
                'student_id' => $student->id,
                'fee_category_id' => $feeCategory->id,
                'academic_year_id' => $academicYear->id,
                'reason' => $reason,
                'excluded_by' => $actorId,
            ]);

            $adjusted = $this->recalculate($student, $feeCategory, $academicYear);

            return ['exclusion' => $exclusion, 'adjusted_invoices' => $adjusted];
        });
    }

    /**
     * Undoes an exclusion. Deliberately not retroactive — it does not add a
     * line item back to invoices already generated while the student was
     * excluded, since there's no unambiguous way to know which fee
     * structure would have applied (the invoice's own term-specific one?
     * whichever is active today?). It only stops the student from being
     * excluded again the next time invoices are generated for their class.
     */
    public function include(StudentFeeExclusion $exclusion): void
    {
        $exclusion->delete();
    }

    /**
     * @return array<array{invoice_number: string, total_amount: string, balance: string}>
     */
    protected function recalculate(Student $student, FeeCategory $feeCategory, AcademicYear $academicYear): array
    {
        $invoices = Invoice::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->where('status', '!=', 'cancelled')
            ->with(['items' => fn ($q) => $q->with(['feeStructure' => fn ($q) => $q->withTrashed()])])
            ->get();

        $adjusted = [];

        foreach ($invoices as $invoice) {
            $matchingItems = $invoice->items->filter(
                fn ($item) => $item->feeStructure?->fee_category_id === $feeCategory->id
            );

            if ($matchingItems->isEmpty()) {
                continue;
            }

            $removedAmount = (string) $matchingItems->sum('amount');
            $newTotal = bcsub((string) $invoice->total_amount, $removedAmount, 2);

            if (bccomp((string) $invoice->amount_paid, $newTotal, 2) > 0) {
                throw ValidationException::withMessages([
                    'fee_category_id' => "Removing this fee would leave invoice {$invoice->invoice_number} overpaid — adjust or refund its payments first.",
                ]);
            }

            foreach ($matchingItems as $item) {
                $item->delete();
            }

            $remainingItemCount = $invoice->items->count() - $matchingItems->count();

            if ($remainingItemCount <= 0) {
                $invoice->delete();

                continue;
            }

            $invoice->total_amount = $newTotal;
            $invoice->status = InvoiceService::computeStatus($invoice);
            $invoice->save();

            $adjusted[] = [
                'invoice_number' => $invoice->invoice_number,
                'total_amount' => (string) $invoice->total_amount,
                'balance' => $invoice->balance,
            ];
        }

        return $adjusted;
    }
}
