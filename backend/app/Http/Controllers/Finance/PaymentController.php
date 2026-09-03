<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\RecordPaymentRequest;
use App\Http\Resources\Finance\InvoiceResource;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Finance\InvoiceService;
use App\Services\Notifications\SchoolEventNotifier;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected SchoolEventNotifier $notifier,
    ) {}

    public function store(RecordPaymentRequest $request, Invoice $invoice)
    {
        $payment = $this->invoiceService->recordPayment($invoice, $request->validated(), $request->user()->id);
        rescue(fn () => $this->notifier->payment($invoice, $payment->id, (string) $payment->amount), report: true);

        return new InvoiceResource(
            $invoice->fresh()->load([
                'student', 'academicYear', 'term',
                'items.feeStructure' => fn ($q) => $q->withTrashed()->with('feeCategory'),
                'payments.receivedBy', 'payments.feeCategory', 'payments.reversal',
            ])
        );
    }

    public function reverse(Request $request, Payment $payment)
    {
        abort_unless($request->user()->can('finance.manage'), 403);
        $data = $request->validate(['reason' => ['required', 'string', 'min:3', 'max:255']]);
        $this->invoiceService->reversePayment($payment, $data['reason'], $request->user()->id);

        return new InvoiceResource($payment->invoice->fresh()->load([
            'student', 'academicYear', 'term', 'items.feeStructure.feeCategory',
            'payments.receivedBy', 'payments.feeCategory', 'payments.reversal',
        ]));
    }
}
