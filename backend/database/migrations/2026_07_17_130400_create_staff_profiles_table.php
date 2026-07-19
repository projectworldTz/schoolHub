<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extra profile data for a staff member — teacher or otherwise. One
     * users row can carry both "Teacher" and other roles, so this is a
     * single table rather than separate teacher/employee tables; the
     * user's roles (Phase 1) already distinguish "teacher" from "non-
     * teaching staff" without duplicating hire_date/department/etc.
     */
    public function up(): void
    {
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('user_id');
            $table->uuid('department_id')->nullable();
            $table->string('staff_number');
            $table->string('job_title')->nullable();
            $table->enum('employment_type', ['full_time', 'part_time', 'contract'])->default('full_time');
            $table->date('hire_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->text('bio')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->unique('user_id');
            $table->unique(['school_id', 'staff_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_profiles');
    }
};
