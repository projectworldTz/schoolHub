<?php

namespace App\Services\AI\Tools;

use App\Models\Invoice;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;

/**
 * "Show students with outstanding fees." Reuses Invoice's own `balance`
 * accessor (bcsub of total_amount/amount_paid) rather than recalculating —
 * see Invoice::getBalanceAttribute(). No discounts/scholarships/credit-note
 * fields exist in this schema; the balance is exactly total minus paid.
 */
class OutstandingFeesTool
{
    protected const MAX_LISTED = 20;

    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function name(): string
    {
        return 'finance.outstanding_fees';
    }

    public function authorize(User $user): bool|string
    {
        if (! $this->authorization->canUseFeesTool($user)) {
            return 'You do not have permission to view outstanding fee information.';
        }

        return true;
    }

    /** @param  array<string, mixed>  $params */
    public function run(array $params): array
    {
        $query = Invoice::query()
            ->whereColumn('amount_paid', '<', 'total_amount')
            ->with('student.currentEnrollment.schoolClass');

        if (filled($params['class_name'] ?? null)) {
            $className = $params['class_name'];
            $query->whereHas(
                'student.currentEnrollment.schoolClass',
                fn ($q) => $q->where('name', 'like', $className)
            );
        }

        $invoices = $query->get();

        if ($invoices->isEmpty()) {
            return ['total_students_with_balance' => 0, 'total_outstanding' => 0, 'students' => []];
        }

        $totalOutstanding = $invoices->reduce(
            fn ($carry, Invoice $invoice) => bcadd((string) $carry, $invoice->balance, 2),
            '0'
        );

        $students = $invoices
            ->sortByDesc(fn (Invoice $invoice) => (float) $invoice->balance)
            ->take(self::MAX_LISTED)
            ->map(fn (Invoice $invoice) => [
                'admission_number' => $invoice->student->admission_number,
                'name' => "{$invoice->student->first_name} {$invoice->student->last_name}",
                'class_name' => $invoice->student->currentEnrollment?->schoolClass?->name,
                'balance' => (float) $invoice->balance,
            ])
            ->values()
            ->all();

        return [
            'total_students_with_balance' => $invoices->count(),
            'total_outstanding' => (float) $totalOutstanding,
            'students' => $students,
            'truncated' => $invoices->count() > self::MAX_LISTED,
        ];
    }
}
