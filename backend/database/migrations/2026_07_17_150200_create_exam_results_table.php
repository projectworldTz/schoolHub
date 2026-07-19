<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per (exam_subject, student) is created up front for every
     * actively-enrolled student when a subject is added to an exam — same
     * "stub row, status implied by null marks" pattern as homework_submissions.
     */
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('exam_subject_id');
            $table->uuid('student_id');
            $table->decimal('marks_obtained', 6, 2)->nullable();
            $table->string('grade', 10)->nullable();
            $table->text('remarks')->nullable();
            $table->uuid('entered_by')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('exam_subject_id')->references('id')->on('exam_subjects')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('entered_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['exam_subject_id', 'student_id'], 'exam_result_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
