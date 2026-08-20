<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_papers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('school_class_id');
            $table->uuid('subject_id');
            $table->uuid('created_by');
            $table->string('title');
            $table->date('exam_date')->nullable();
            $table->unsignedInteger('duration_minutes');
            $table->text('instructions')->nullable();
            $table->json('sections');
            $table->unsignedInteger('total_marks')->default(0);
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_papers');
    }
};
