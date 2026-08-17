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
        Schema::table('schools', function (Blueprint $table) {
            // Plain strings, not numeric — mobile money/bank account
            // numbers can carry leading zeros or non-digit characters.
            $table->string('payment_account_name')->nullable();
            $table->string('payment_account_number')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['payment_account_name', 'payment_account_number']);
        });
    }
};
