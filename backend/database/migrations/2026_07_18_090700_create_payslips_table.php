<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One payslip per staff member is snapshotted from their StaffSalary
     * at the moment the run is created — later changes to StaffSalary
     * shouldn't retroactively change an already-generated payslip.
     */
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('payroll_run_id');
            $table->uuid('user_id');
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2);
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->date('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('payroll_run_id')->references('id')->on('payroll_runs')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['payroll_run_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
