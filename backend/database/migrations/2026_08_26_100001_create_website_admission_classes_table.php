<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One optional settings row per real SchoolClass — same "fixed set of
     * real entities" shape as website_sections, not free CRUD. A class with
     * no row here just isn't shown/configured yet (defaults to hidden).
     */
    public function up(): void
    {
        Schema::create('website_admission_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('school_class_id');
            $table->string('summary')->nullable();
            $table->text('requirements')->nullable();
            $table->boolean('is_visible')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->unique(['school_id', 'school_class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_admission_classes');
    }
};
