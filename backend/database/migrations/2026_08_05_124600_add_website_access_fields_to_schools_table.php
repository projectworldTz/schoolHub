<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Website Builder premium access — same shape as the ai_* fields added
     * in 2026_08_02_121855_add_ai_access_fields_to_schools_table.php. No
     * usage-limit column: unlike AI this isn't a metered, per-request
     * feature.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->boolean('website_enabled')->default(false);
            $table->timestamp('website_activated_at')->nullable();
            $table->timestamp('website_expires_at')->nullable();
            $table->timestamp('website_suspended_at')->nullable();
            $table->text('website_suspension_reason')->nullable();
            $table->uuid('website_access_updated_by')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn([
                'website_enabled',
                'website_activated_at',
                'website_expires_at',
                'website_suspended_at',
                'website_suspension_reason',
                'website_access_updated_by',
            ]);
        });
    }
};
