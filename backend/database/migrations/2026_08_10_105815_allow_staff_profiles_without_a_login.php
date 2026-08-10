<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Support staff (cooks, drivers, gate keepers, general helpers) don't
     * need a system login at all — until now every staff_profiles row
     * required a users row, forcing an email/password/role on people who'll
     * never sign in. user_id becomes optional; name/phone move onto this
     * table directly for the no-login case (MySQL's UNIQUE index still
     * allows any number of NULLs, so the existing unique(user_id) is safe
     * to keep as-is here).
     */
    public function up(): void
    {
        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
            $table->string('name')->nullable()->after('user_id');
            $table->string('phone')->nullable()->after('name');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['name', 'phone']);
        });

        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
