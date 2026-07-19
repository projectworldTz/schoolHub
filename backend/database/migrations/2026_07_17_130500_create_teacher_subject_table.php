<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Which subjects a teacher is qualified/assigned to teach. */
    public function up(): void
    {
        Schema::create('teacher_subject', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->uuid('subject_id');
            $table->timestamps();

            $table->primary(['user_id', 'subject_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_subject');
    }
};
