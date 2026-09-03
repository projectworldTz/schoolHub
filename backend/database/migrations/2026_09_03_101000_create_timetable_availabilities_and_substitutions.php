<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_availabilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id')->index();
            $table->uuid('teacher_id')->index();
            $table->uuid('academic_year_id')->index();
            $table->uuid('timetable_period_id');
            $table->string('day_of_week', 12);
            $table->boolean('is_available')->default(false);
            $table->timestamps();
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('timetable_period_id')->references('id')->on('timetable_periods')->cascadeOnDelete();
            $table->unique(['teacher_id', 'academic_year_id', 'day_of_week', 'timetable_period_id'], 'teacher_availability_slot_unique');
        });

        Schema::create('timetable_substitutions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id')->index();
            $table->uuid('timetable_entry_id');
            $table->uuid('substitute_teacher_id')->index();
            $table->date('date')->index();
            $table->string('reason')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('timetable_entry_id')->references('id')->on('timetable_entries')->cascadeOnDelete();
            $table->foreign('substitute_teacher_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['timetable_entry_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_substitutions');
        Schema::dropIfExists('teacher_availabilities');
    }
};
