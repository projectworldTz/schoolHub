<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lightweight, append-only event log powering the Phase-1 basic
     * Analytics tab (counts over time, most-viewed sections, download
     * counts, admission-button clicks). Deliberately no device/country/
     * traffic-source columns — that's a later phase, not stored here.
     * created_at only, no updated_at: events are never mutated.
     */
    public function up(): void
    {
        Schema::create('website_page_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->enum('event_type', ['page_view', 'section_view', 'download', 'admission_click']);
            $table->string('section_key')->nullable();
            $table->string('referrer', 512)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->index(['school_id', 'event_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_page_views');
    }
};
