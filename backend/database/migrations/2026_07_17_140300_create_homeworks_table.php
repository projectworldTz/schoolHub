<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homeworks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('school_class_id');
            $table->uuid('stream_id')->nullable();
            $table->uuid('subject_id');
            $table->uuid('teacher_id');
            $table->uuid('academic_year_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('stream_id')->references('id')->on('streams')->nullOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->index(['school_class_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('homeworks');
    }
};
