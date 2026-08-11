<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\GenerateInvoicesRequest;
use App\Http\Resources\Finance\InvoiceResource;
use App\Models\Invoice;
use App\Models\School;
use App\Services\Finance\InvoiceService;
use App\Support\Tenancy\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $invoiceService) {}

    public function index(Request $request)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $invoices = $this->filteredQuery($request)
            ->with(['student', 'academicYear', 'term'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return InvoiceResource::collection($invoices);
    }

    /**
     * A printable fee report — every invoice matching the same status/search
     * filters as the on-screen list, but unpaginated (this is a full export
     * for the accountant/director to print or file, not a page of results).
     */
    public function pdf(Request $request)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $invoices = $this->filteredQuery($request)
            ->with('student')
            ->get()
            ->sortBy(fn (Invoice $invoice) => $invoice->student?->last_name)
            ->values();

        $status = $request->input('status');
        $totals = [
            'total_amount' => $invoices->sum('total_amount'),
            'amount_paid' => $invoices->sum('amount_paid'),
            'balance' => $invoices->sum(fn (Invoice $invoice) => (float) $invoice->balance),
        ];

        $pdf = Pdf::loadView('documents.fee-report', [
            'school' => $this->currentSchool($request),
            'invoices' => $invoices,
            'status' => $status,
            'totals' => $totals,
        ])->setPaper('a4', 'landscape');

        return $pdf->download(Str::slug('fee-report-'.($status ?? 'all')).'.pdf');
    }

    protected function filteredQuery(Request $request): Builder
    {
        return Invoice::query()
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('student', function ($q) use ($search) {
                            $q->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('admission_number', 'like', "%{$search}%");
                        });
                });
            });
    }

    protected function currentSchool(Request $request): School
    {
        abort_unless(Tenant::id(), 403, 'This account is not attached to a school.');

        return School::findOrFail(Tenant::id());
    }

    public function generate(GenerateInvoicesRequest $request)
    {
        $result = $this->invoiceService->generateForClass($request->validated());

        $invoices = collect($result['invoices'])->each->load([
            'student', 'academicYear', 'term',
            'items.feeStructure' => fn ($q) => $q->withTrashed()->with('feeCategory'),
        ]);

        return response()->json([
            'data' => InvoiceResource::collection($invoices)->resolve(),
            'skipped_students' => $result['skipped_students'],
        ]);
    }

    public function show(Request $request, Invoice $invoice)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        return new InvoiceResource(
            $invoice->load([
                'student', 'academicYear', 'term',
                'items.feeStructure' => fn ($q) => $q->withTrashed()->with('feeCategory'),
                'payments.receivedBy', 'payments.feeCategory',
            ])
        );
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $invoice->delete();

        return response()->noContent();
    }
}
