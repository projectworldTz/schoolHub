<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The one deliberate touch to an existing table for the Website Builder
     * module: lets a School Owner flag an announcement as "Publish Public"
     * at creation time. Nullable-default-false, so every existing row is
     * unaffected and every school without website_enabled just has an inert
     * boolean nobody sees — same safe-additive pattern as ai_enabled/
     * custom_domain on schools.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->boolean('is_public_website')->default(false)->after('published_at');
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('is_public_website');
        });
    }
};
