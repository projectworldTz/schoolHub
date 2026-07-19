<?php

namespace App\Services\Finance;

use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Models\StaffSalary;
use Illuminate\Support\Facades\DB;

class PayrollService
{
    /**
     * Payslips snapshot each StaffSalary at the moment the run is
     * processed (see the migration comment) — re-running just refreshes
     * that snapshot for anyone whose salary changed before payout.
     */
    public function processRun(PayrollRun $run): void
    {
        DB::transaction(function () use ($run) {
            $salaries = StaffSalary::all();

            foreach ($salaries as $salary) {
                Payslip::updateOrCreate(
                    ['payroll_run_id' => $run->id, 'user_id' => $salary->user_id],
                    [
                        'basic_salary' => $salary->basic_salary,
                        'allowances' => $salary->allowances,
                        'deductions' => $salary->deductions,
                        'net_salary' => $salary->net_salary,
                    ]
                );
            }

            $run->update(['status' => 'processed', 'processed_at' => now()]);
        });
    }
}
