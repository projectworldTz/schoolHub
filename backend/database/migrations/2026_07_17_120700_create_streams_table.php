<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A section within a class level for one academic year (e.g. "Form 1
     * Blue"). Scoped per academic_year since a class's streams (capacity,
     * class teacher, room) are typically re-decided every year.
     */
    public function up(): void
    {
        Schema::create('streams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('school_class_id');
            $table->uuid('academic_year_id');
            $table->string('name');
            $table->unsignedInteger('capacity')->nullable();
            $table->uuid('class_teacher_id')->nullable();
            $table->uuid('room_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('class_teacher_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('room_id')->references('id')->on('rooms')->nullOnDelete();
            $table->unique(['school_class_id', 'academic_year_id', 'name'], 'streams_class_year_name_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('streams');
    }
};
