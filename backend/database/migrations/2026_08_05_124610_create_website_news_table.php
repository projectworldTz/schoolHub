<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links a curated Announcement to the public website — a row's mere
     * existence is what makes an announcement appear on the site. Created/
     * removed automatically when an Announcement's is_public_website flag
     * is toggled (see App\Observers\AnnouncementObserver), and independently
     * editable here for is_featured/sort_order without touching the
     * announcement itself.
     */
    public function up(): void
    {
        Schema::create('website_news', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('announcement_id');
            $table->boolean('is_featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('announcement_id')->references('id')->on('announcements')->cascadeOnDelete();
            $table->unique('announcement_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_news');
    }
};
