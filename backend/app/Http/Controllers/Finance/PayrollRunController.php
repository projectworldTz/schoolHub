<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\PayrollRunRequest;
use App\Http\Resources\Finance\PayrollRunResource;
use App\Models\PayrollRun;
use App\Services\Finance\PayrollService;
use Illuminate\Http\Request;

class PayrollRunController extends Controller
{
    public function __construct(protected PayrollService $payrollService) {}

    public function index()
    {
        return PayrollRunResource::collection(
            PayrollRun::query()->withCount('payslips')->orderByDesc('year')->orderByDesc('month')->get()
        );
    }

    public function store(PayrollRunRequest $request)
    {
        $run = PayrollRun::create($request->validated());

        return new PayrollRunResource($run->loadCount('payslips'));
    }

    public function show(PayrollRun $payroll_run)
    {
        return new PayrollRunResource($payroll_run->load('payslips.user'));
    }

    public function process(Request $request, PayrollRun $payroll_run)
    {
        abort_unless($request->user()->can('payroll.manage'), 403);

        $this->payrollService->processRun($payroll_run);

        return new PayrollRunResource($payroll_run->fresh()->load('payslips.user'));
    }

    public function destroy(Request $request, PayrollRun $payroll_run)
    {
        abort_unless($request->user()->can('payroll.manage'), 403);

        $payroll_run->delete();

        return response()->noContent();
    }
}
