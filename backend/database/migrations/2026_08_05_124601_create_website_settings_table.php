<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per school — the Website Builder equivalent of school
     * profile/settings, but deliberately kept separate from `schools` /
     * SchoolProfileController so SchoolHub configuration and public-website
     * configuration never share a table (see the module's own plan doc).
     */
    public function up(): void
    {
        Schema::create('website_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('theme_key')->default('modern');
            $table->string('primary_color')->nullable();

            $table->string('motto')->nullable();
            $table->string('principal_name')->nullable();
            $table->text('principal_message')->nullable();
            $table->text('mission')->nullable();
            $table->text('vision')->nullable();
            $table->text('core_values')->nullable();
            $table->string('hero_image_path')->nullable();
            $table->string('hero_video_path')->nullable();

            $table->enum('stats_visibility', ['publish', 'hide', 'summary_only'])->default('summary_only');

            $table->enum('admission_status', ['open', 'closed'])->default('closed');
            $table->date('admission_open_date')->nullable();
            $table->date('admission_close_date')->nullable();
            $table->text('admission_requirements')->nullable();

            $table->string('facebook_url')->nullable();
            $table->string('twitter_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('whatsapp_number')->nullable();
            $table->string('google_maps_embed_url')->nullable();

            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();

            $table->text('custom_css')->nullable();

            $table->boolean('is_published')->default(false);

            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->unique('school_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_settings');
    }
};
