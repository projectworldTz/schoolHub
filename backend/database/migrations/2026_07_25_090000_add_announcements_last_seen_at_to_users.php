<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drives the Parent Portal's unread-announcements badge — a per-login
 * "last time I looked at announcements" marker, not per-announcement read
 * tracking (no recipients table exists, and a simple last-seen timestamp
 * is enough to answer "how many are new since I last checked").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('announcements_last_seen_at')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('announcements_last_seen_at');
        });
    }
};
