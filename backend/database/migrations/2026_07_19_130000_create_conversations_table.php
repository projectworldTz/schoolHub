<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per unordered pair of users. user_one_id/user_two_id are
     * canonicalized (smaller UUID first) by ConversationController before
     * insert, so the unique constraint below is enough to dedupe — MySQL
     * has no "unordered pair" unique index, so the ordering has to happen
     * at the app layer, the same reasoning the timetable conflict-check
     * migration comment gives for its own app-level check.
     */
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('user_one_id');
            $table->uuid('user_two_id');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('user_one_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('user_two_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_one_id', 'user_two_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
