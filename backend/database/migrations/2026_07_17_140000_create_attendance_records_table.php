<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Daily, class-level attendance (one row per student per day) rather
     * than per-period — matches the "manual first" register pattern most
     * schools actually run day to day. Per-period attendance can be layered
     * on later without touching this table, since Timetable already models
     * periods separately.
     */
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->uuid('school_class_id');
            $table->uuid('stream_id')->nullable();
            $table->uuid('academic_year_id');
            $table->date('date');
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');
            $table->text('remarks')->nullable();
            $table->uuid('marked_by')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('stream_id')->references('id')->on('streams')->nullOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('marked_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['student_id', 'date']);
            $table->index(['school_class_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
