<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `trial_ends_at` was written on school creation (a silent 30-day default)
 * but never read anywhere — this migration turns it into the enforced
 * "license expiry" the Super Admin now sets explicitly (1/3/6/12 months)
 * and the School Owner dashboard now warns about.
 *
 * Backfill: any school that predates this feature (including every
 * seeder-created demo school, which never set trial_ends_at at all) gets
 * license_expires_at = created_at + 1 month, the same default a brand new
 * school gets today — so the dashboard/platform indicators are meaningful
 * immediately, even for a school registered hours before this shipped,
 * without special-casing "old" vs "new" schools anywhere in app code.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->renameColumn('trial_ends_at', 'license_expires_at');
        });

        DB::table('schools')->whereNull('license_expires_at')->orderBy('id')->get(['id', 'created_at'])->each(
            fn ($school) => DB::table('schools')->where('id', $school->id)->update([
                'license_expires_at' => Carbon::parse($school->created_at)->addMonth(),
            ])
        );
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->renameColumn('license_expires_at', 'trial_ends_at');
        });
    }
};
