<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An exam is the named event (e.g. "End of Term 2 Exams"); which
     * class/subject combinations sit inside it — with their own max marks
     * and date — live in exam_subjects, not here.
     */
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('academic_year_id');
            $table->uuid('term_id')->nullable();
            $table->string('name');
            $table->enum('exam_type', ['quiz', 'midterm', 'final', 'mock', 'other'])->default('final');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'completed', 'published'])->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('term_id')->references('id')->on('terms')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
