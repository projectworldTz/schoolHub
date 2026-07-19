<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('academic_year_id');
            $table->uuid('applying_for_class_id');
            $table->uuid('student_id')->nullable()->comment('Set once the application is enrolled');
            $table->string('applicant_first_name');
            $table->string('applicant_last_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('guardian_name');
            $table->string('guardian_phone');
            $table->string('guardian_email')->nullable();
            $table->enum('status', ['pending', 'under_review', 'accepted', 'rejected', 'enrolled'])->default('pending');
            $table->text('notes')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('applying_for_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};
