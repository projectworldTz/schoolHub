<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only audit log of every students.status transition (active ->
     * graduated/transferred/withdrawn), written automatically from
     * Student::booted() whenever 'status' changes — regardless of whether
     * the change came from a single student edit or a batch graduation run
     * — so this table can never drift out of sync with the student record
     * itself. No soft deletes: it's a ledger, same reasoning as
     * inventory_transactions.
     */
    public function up(): void
    {
        Schema::create('student_status_changes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->string('from_status');
            $table->string('to_status');
            $table->date('effective_date');
            $table->text('reason')->nullable();
            $table->uuid('changed_by')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('changed_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['student_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_status_changes');
    }
};
