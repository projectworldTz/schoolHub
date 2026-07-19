<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The compound unique index below only fully protects classes WITHOUT a
     * stream — MySQL treats each NULL in a unique index as distinct, so two
     * rows with the same (class, day, period) but stream_id = NULL would
     * both pass it. Real double-booking prevention (including the
     * NULL-stream and teacher/room-conflict cases) is enforced in
     * TimetableEntryService, not the schema.
     */
    public function up(): void
    {
        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('school_class_id');
            $table->uuid('stream_id')->nullable();
            $table->uuid('subject_id');
            $table->uuid('teacher_id');
            $table->uuid('room_id')->nullable();
            $table->uuid('timetable_period_id');
            $table->uuid('academic_year_id');
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('stream_id')->references('id')->on('streams')->nullOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('room_id')->references('id')->on('rooms')->nullOnDelete();
            $table->foreign('timetable_period_id')->references('id')->on('timetable_periods')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->unique(
                ['school_class_id', 'stream_id', 'day_of_week', 'timetable_period_id', 'academic_year_id'],
                'timetable_class_slot_unique'
            );
            $table->index(['teacher_id', 'day_of_week', 'timetable_period_id'], 'timetable_teacher_slot_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_entries');
    }
};
