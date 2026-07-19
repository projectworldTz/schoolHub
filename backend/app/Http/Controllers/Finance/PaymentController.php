<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\RecordPaymentRequest;
use App\Http\Resources\Finance\InvoiceResource;
use App\Models\Invoice;
use App\Services\Finance\InvoiceService;

class PaymentController extends Controller
{
    public function __construct(protected InvoiceService $invoiceService) {}

    public function store(RecordPaymentRequest $request, Invoice $invoice)
    {
        $this->invoiceService->recordPayment($invoice, $request->validated(), $request->user()->id);

        return new InvoiceResource(
            $invoice->fresh()->load(['student', 'academicYear', 'term', 'items', 'payments.receivedBy'])
        );
    }
}
