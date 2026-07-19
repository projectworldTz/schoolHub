<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Multiple rows per student per academic year are allowed on purpose —
     * a mid-year stream/class change is recorded as a new row (old one
     * marked 'transferred') rather than mutating history away. Exactly one
     * row should be 'active' per (student, academic_year) at a time; that's
     * enforced in StudentEnrollmentController, not the schema, since it's a
     * "current state" rule rather than a row-uniqueness rule.
     */
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->uuid('academic_year_id');
            $table->uuid('school_class_id');
            $table->uuid('stream_id')->nullable();
            $table->enum('status', ['active', 'transferred', 'graduated', 'withdrawn'])->default('active');
            $table->date('enrolled_at');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('stream_id')->references('id')->on('streams')->nullOnDelete();
            $table->index(['student_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
