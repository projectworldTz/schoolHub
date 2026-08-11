<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_fee_exclusions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->uuid('fee_category_id');
            $table->uuid('academic_year_id');
            $table->text('reason')->nullable();
            $table->uuid('excluded_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('fee_category_id')->references('id')->on('fee_categories')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('excluded_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['student_id', 'fee_category_id', 'academic_year_id'], 'student_fee_exclusions_lookup_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_fee_exclusions');
    }
};
