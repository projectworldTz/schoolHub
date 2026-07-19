<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff/teacher attendance — the same "one row per person per day" register
 * pattern as student attendance_records, but with no class/stream scoping
 * since staff aren't tied to a class the way students are.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_attendance_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('user_id');
            $table->date('date');
            $table->enum('status', ['present', 'absent', 'late', 'excused', 'on_leave'])->default('present');
            $table->text('remarks')->nullable();
            $table->uuid('marked_by')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('marked_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['user_id', 'date']);
            $table->index(['school_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_attendance_records');
    }
};
