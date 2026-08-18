<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How many academic years a student typically spends at this class
     * level before advancing — e.g. a 2-year Pre-Unit/Nursery stage vs. 1
     * year per Standard/Form level. Drives the student import's Enrollment
     * Year calculation (cumulative duration of every class below this
     * one's `level`), without hardcoding calendar years or class names:
     * defaults to 1 (one year per level), matching the assumption every
     * class made before this column existed.
     */
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->unsignedTinyInteger('duration_years')->default(1)->after('level');
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropColumn('duration_years');
        });
    }
};
