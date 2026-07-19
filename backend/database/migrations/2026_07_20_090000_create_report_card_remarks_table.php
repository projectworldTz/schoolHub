<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The class teacher's own free-text comment on a student's report card
     * for one exam ("Good effort this term, needs to work on Chemistry.").
     * Separate from the auto-generated PerformanceMessageService message —
     * that one is always computed fresh from the marks; this one is a
     * human's personal note and needs somewhere to persist.
     */
    public function up(): void
    {
        Schema::create('report_card_remarks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('exam_id');
            $table->uuid('student_id');
            $table->text('remark');
            $table->uuid('entered_by')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('entered_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['exam_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_card_remarks');
    }
};
