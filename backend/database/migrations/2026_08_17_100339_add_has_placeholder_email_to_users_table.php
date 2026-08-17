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
        Schema::table('users', function (Blueprint $table) {
            // True for an account created without a real email (a teacher
            // who has none yet) — the email column is a system-generated
            // placeholder in that case, not a contactable address. Lets
            // the UI offer "Add email for this user" only where it's
            // actually meaningful, and tells the backend not to send mail
            // to that address.
            $table->boolean('has_placeholder_email')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('has_placeholder_email');
        });
    }
};
