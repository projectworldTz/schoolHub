<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An append-only ledger of who changed what — same "no soft deletes,
     * it's a ledger" reasoning as inventory_transactions/
     * student_status_changes. No updated_at: a log entry is never edited
     * after the fact (see ActivityLog::UPDATED_AT = null).
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('user_id')->nullable();
            $table->string('subject_type');
            $table->uuid('subject_id');
            $table->string('action');
            $table->string('description');
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
