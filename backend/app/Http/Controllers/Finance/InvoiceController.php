<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\GenerateInvoicesRequest;
use App\Http\Resources\Finance\InvoiceResource;
use App\Models\Invoice;
use App\Services\Finance\InvoiceService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $invoiceService) {}

    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->with(['student', 'academicYear', 'term'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return InvoiceResource::collection($invoices);
    }

    public function generate(GenerateInvoicesRequest $request)
    {
        $invoices = $this->invoiceService->generateForClass($request->validated());

        return InvoiceResource::collection(
            collect($invoices)->each->load(['student', 'academicYear', 'term', 'items'])
        );
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource(
            $invoice->load(['student', 'academicYear', 'term', 'items', 'payments.receivedBy'])
        );
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $invoice->delete();

        return response()->noContent();
    }
}
