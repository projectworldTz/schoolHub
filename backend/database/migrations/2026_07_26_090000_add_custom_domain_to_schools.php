<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Groundwork for per-school custom domains (see App\Http\Middleware\
 * ResolveTenantFromUser) — written and deployed ahead of any school
 * actually having one. Nullable + unique: every existing school gets NULL,
 * which the resolver treats as "no custom domain, behave exactly as
 * before" — this migration changes nothing observable until a Super Admin
 * explicitly sets a domain on some school.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('custom_domain')->nullable()->unique()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('custom_domain');
        });
    }
};
