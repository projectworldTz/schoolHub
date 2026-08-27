<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** One optional public-facing settings row per real Department — same shape as website_admission_classes. */
    public function up(): void
    {
        Schema::create('website_academic_department_info', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('department_id');
            $table->text('public_description')->nullable();
            $table->boolean('is_visible')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->cascadeOnDelete();
            $table->unique(['school_id', 'department_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_academic_department_info');
    }
};
