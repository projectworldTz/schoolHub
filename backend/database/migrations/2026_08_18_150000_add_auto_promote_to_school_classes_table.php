<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Whether this class participates in the annual bulk promotion run.
     * Off for early-childhood stages (Pre-Unit, Nursery, ...) that schools
     * typically want to advance by hand rather than automatically — never a
     * hardcoded class-name check, since naming varies school to school.
     * Defaults on: every class made this the annual-promotion behavior
     * before this column existed.
     */
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->boolean('auto_promote')->default(true)->after('duration_years');
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropColumn('auto_promote');
        });
    }
};
