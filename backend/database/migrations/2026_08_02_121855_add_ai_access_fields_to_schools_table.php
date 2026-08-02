<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->boolean('ai_enabled')->default(false);
            $table->timestamp('ai_activated_at')->nullable();
            $table->timestamp('ai_expires_at')->nullable();
            $table->timestamp('ai_suspended_at')->nullable();
            $table->text('ai_suspension_reason')->nullable();
            $table->unsignedInteger('ai_monthly_request_limit')->nullable();
            $table->uuid('ai_access_updated_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn([
                'ai_enabled',
                'ai_activated_at',
                'ai_expires_at',
                'ai_suspended_at',
                'ai_suspension_reason',
                'ai_monthly_request_limit',
                'ai_access_updated_by',
            ]);
        });
    }
};
