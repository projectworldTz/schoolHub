<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `method` + `provider` record how a payment was actually taken
     * (cash in hand, or which mobile money/gateway rail) without requiring
     * a live integration with that rail — this is manual recording by
     * staff, not a Stripe/Flutterwave/M-Pesa API call. See ROADMAP.md
     * Phase 5 for why the live gateway integrations are deferred.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('invoice_id');
            $table->uuid('student_id');
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other'])->default('cash');
            $table->string('provider')->nullable();
            $table->string('reference')->nullable();
            $table->date('paid_at');
            $table->uuid('received_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('invoice_id')->references('id')->on('invoices')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('received_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
