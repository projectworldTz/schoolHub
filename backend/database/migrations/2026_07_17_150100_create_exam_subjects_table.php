<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('exam_id');
            $table->uuid('school_class_id');
            $table->uuid('subject_id');
            $table->decimal('max_marks', 6, 2)->default(100);
            $table->decimal('pass_marks', 6, 2)->nullable();
            $table->date('exam_date')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->unique(['exam_id', 'school_class_id', 'subject_id'], 'exam_subject_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_subjects');
    }
};
