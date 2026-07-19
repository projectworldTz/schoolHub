<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\PayslipResource;
use App\Models\Payslip;
use Illuminate\Http\Request;

class PayslipController extends Controller
{
    public function markPaid(Request $request, Payslip $payslip)
    {
        abort_unless($request->user()->can('payroll.manage'), 403);

        $payslip->update(['status' => 'paid', 'paid_at' => now()]);

        return new PayslipResource($payslip->load('user'));
    }
}
