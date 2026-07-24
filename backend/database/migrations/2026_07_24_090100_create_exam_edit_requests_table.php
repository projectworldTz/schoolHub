<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_edit_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('exam_subject_id');
            $table->uuid('requested_by');
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            // Set only on approval: a fresh 24h window from review time, not
            // an indefinite unlock — the gradebook re-locks automatically
            // once this passes, same as the original submission grace period.
            $table->timestamp('unlocked_until')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('exam_subject_id')->references('id')->on('exam_subjects')->cascadeOnDelete();
            $table->foreign('requested_by')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['exam_subject_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_edit_requests');
    }
};
