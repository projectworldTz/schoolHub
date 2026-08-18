<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only ledger of every promotion/repeat/graduation applied by
     * the annual (or manual) class-promotion run — same "ledger, no soft
     * deletes" reasoning as student_status_changes. Deliberately separate
     * from student_enrollments: this table records the *event* (who did
     * it, automatic or manual, which academic-year transition it belongs
     * to), while student_enrollments already holds the resulting
     * class-per-year history on its own.
     */
    public function up(): void
    {
        Schema::create('student_promotions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->uuid('from_academic_year_id')->nullable();
            $table->uuid('to_academic_year_id');
            $table->uuid('from_school_class_id')->nullable();
            $table->uuid('to_school_class_id')->nullable();
            $table->enum('action', ['promoted', 'repeated', 'graduated']);
            $table->enum('mode', ['automatic', 'manual']);
            $table->uuid('promoted_by')->nullable();
            $table->timestamp('promoted_at');
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('from_academic_year_id')->references('id')->on('academic_years')->nullOnDelete();
            $table->foreign('to_academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('from_school_class_id')->references('id')->on('school_classes')->nullOnDelete();
            $table->foreign('to_school_class_id')->references('id')->on('school_classes')->nullOnDelete();
            $table->foreign('promoted_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['student_id', 'to_academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_promotions');
    }
};
