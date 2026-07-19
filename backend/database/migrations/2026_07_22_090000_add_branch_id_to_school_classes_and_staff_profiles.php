<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The two tables branch actually needs to live on directly. Everything
     * else that's branch-specific already threads a school_class_id (or,
     * for a Student, a current enrollment's school_class_id) through the
     * schema — attendance_records, exam_subjects, timetable_entries,
     * homeworks, admission_applications (via applying_for_class_id) all
     * derive their branch transitively through the class they're already
     * linked to, rather than needing their own branch_id column. Staff
     * aren't tied to a single class the way a student's current enrollment
     * is, so staff_profiles needs its own column. Both nullable: a school
     * that hasn't set up branches yet (the common case — most schools have
     * exactly one campus) shouldn't be forced to assign one.
     */
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->uuid('branch_id')->nullable()->after('school_id');
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->uuid('branch_id')->nullable()->after('department_id');
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });

        Schema::table('staff_profiles', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
