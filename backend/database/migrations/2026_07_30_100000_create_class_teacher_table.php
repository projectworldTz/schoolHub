<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which classes a teacher is assigned to — the source of truth for
     * scoping a teacher's visibility/authority (class dropdowns, exam
     * subjects, class-audience announcements) to only their own classes.
     * A stream's own `class_teacher_id` (homeroom) counts as assigned too,
     * see User::assignedClassIds() — this table is for any *additional*
     * classes an admin assigns beyond that.
     */
    public function up(): void
    {
        Schema::create('class_teacher', function (Blueprint $table) {
            $table->uuid('school_class_id');
            $table->uuid('user_id');
            $table->timestamps();

            $table->primary(['school_class_id', 'user_id']);
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_teacher');
    }
};
