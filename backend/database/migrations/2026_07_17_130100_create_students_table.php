<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The student's static profile. Which class/stream they're currently
     * in — and their enrollment history — lives in student_enrollments,
     * not here, since that changes every academic year.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('user_id')->nullable();
            $table->string('admission_number');
            $table->string('first_name');
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('blood_group')->nullable();
            $table->text('allergies')->nullable();
            $table->text('medical_notes')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('previous_school_name')->nullable();
            $table->string('qr_code')->unique();
            $table->enum('status', ['active', 'graduated', 'transferred', 'withdrawn'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['school_id', 'admission_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
