<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drives section order + show/hide on the public one-page site. Rows
     * are seeded (one per section_key) the first time a school's Website
     * Builder settings are touched — see WebsiteSettingsController.
     */
    public function up(): void
    {
        Schema::create('website_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->string('section_key');
            $table->boolean('is_visible')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->unique(['school_id', 'section_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_sections');
    }
};
