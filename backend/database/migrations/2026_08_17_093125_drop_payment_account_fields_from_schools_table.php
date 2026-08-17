<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Superseded by school_payment_accounts (a school can have several —
        // e.g. separate TZS accounts at different banks plus a USD account —
        // not just one).
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['payment_account_name', 'payment_account_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('payment_account_name')->nullable();
            $table->string('payment_account_number')->nullable();
        });
    }
};
