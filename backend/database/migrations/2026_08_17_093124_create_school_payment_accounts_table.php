<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_payment_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->string('account_name');
            // String, not numeric — bank/mobile money account numbers can
            // carry leading zeros or non-digit characters.
            $table->string('account_number');
            // Free text, not a strict ISO-4217 check — a school might label
            // this "TZS", "USD", or something else entirely.
            $table->string('currency')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_payment_accounts');
    }
};
