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
        Schema::table('school_payment_accounts', function (Blueprint $table) {
            // Nullable at the DB level only so this migration doesn't
            // choke on any account already saved before this field
            // existed — the request validation requires it for every new
            // save going forward (see SchoolPaymentAccountRequest).
            $table->string('bank_name')->nullable()->after('account_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_payment_accounts', function (Blueprint $table) {
            $table->dropColumn('bank_name');
        });
    }
};
