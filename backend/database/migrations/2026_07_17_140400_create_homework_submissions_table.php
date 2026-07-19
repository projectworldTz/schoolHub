<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per (homework, student) is created up front for every student
     * with an active enrollment in the homework's class at assignment time
     * (see HomeworkService::create) — status starts 'pending' rather than
     * the row not existing until the student acts, so "who hasn't submitted
     * yet" is a plain query instead of a diff against the class roster.
     */
    public function up(): void
    {
        Schema::create('homework_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('homework_id');
            $table->uuid('student_id');
            $table->enum('status', ['pending', 'submitted', 'graded', 'late'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('grade', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('homework_id')->references('id')->on('homeworks')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->unique(['homework_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('homework_submissions');
    }
};
