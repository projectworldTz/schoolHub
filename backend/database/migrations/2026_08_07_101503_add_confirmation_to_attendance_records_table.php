<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Once a class+date's attendance is confirmed it becomes immutable — see
     * AttendanceController::store()'s guard. confirmed_by is nullable/
     * nullOnDelete like marked_by, since we don't want a deleted user account
     * to cascade-delete historical attendance records.
     */
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->timestamp('confirmed_at')->nullable()->after('marked_by');
            $table->uuid('confirmed_by')->nullable()->after('confirmed_at');
            $table->foreign('confirmed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropForeign(['confirmed_by']);
            $table->dropColumn(['confirmed_at', 'confirmed_by']);
        });
    }
};
