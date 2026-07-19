<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * amount_paid is a stored running total (updated in the same
     * transaction as each Payment) rather than summed on read — it's
     * checked on nearly every invoice list row, so this trades a small
     * write-time cost for avoiding an aggregate join everywhere invoices
     * are displayed.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->uuid('academic_year_id');
            $table->uuid('term_id')->nullable();
            $table->string('invoice_number');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->enum('status', ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'])->default('unpaid');
            $table->date('due_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('term_id')->references('id')->on('terms')->nullOnDelete();
            $table->unique(['school_id', 'invoice_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
