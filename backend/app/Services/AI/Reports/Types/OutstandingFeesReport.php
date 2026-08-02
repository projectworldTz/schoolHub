<?php

namespace App\Services\AI\Reports\Types;

use App\Models\Invoice;
use App\Models\School;
use App\Models\User;
use App\Services\AI\AiAuthorizationService;

/**
 * Same authorization and query shape as
 * App\Services\AI\Tools\OutstandingFeesTool — that tool caps its list at 20
 * rows for a chat reply; this returns every matching row (up to
 * config('ai-reports.max_rows')) since the point is a downloadable export.
 */
class OutstandingFeesReport
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    public static function type(): string
    {
        return 'outstanding_fees';
    }

    public function authorize(User $user): bool|string
    {
        if (! $this->authorization->canUseFeesTool($user)) {
            return 'You do not have permission to export fee information.';
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{title: string, rows: array<int, array<string, mixed>>, truncated: bool}
     */
    public function data(array $params, School $school): array
    {
        $query = Invoice::query()
            ->whereColumn('amount_paid', '<', 'total_amount')
            ->with('student.currentEnrollment.schoolClass');

        $title = 'Outstanding Fees';

        if (filled($params['class_name'] ?? null)) {
            $className = $params['class_name'];
            $query->whereHas(
                'student.currentEnrollment.schoolClass',
                fn ($q) => $q->where('name', 'like', $className)
            );
            $title .= " — {$className}";
        }

        $maxRows = config('ai-reports.max_rows');
        $invoices = $query->orderByDesc('total_amount')->limit($maxRows + 1)->get();
        $truncated = $invoices->count() > $maxRows;
        $invoices = $invoices->take($maxRows);

        $rows = $invoices->map(fn (Invoice $invoice) => [
            'admission_number' => $invoice->student->admission_number,
            'student_name' => "{$invoice->student->first_name} {$invoice->student->last_name}",
            'class_name' => $invoice->student->currentEnrollment?->schoolClass?->name,
            'total_billed' => (float) $invoice->total_amount,
            'total_paid' => (float) $invoice->amount_paid,
            'outstanding_balance' => (float) $invoice->balance,
            'status' => $invoice->status,
        ])->values()->all();

        return ['title' => $title, 'rows' => $rows, 'truncated' => $truncated];
    }
}
