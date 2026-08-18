<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The year a student first joined the school — a static one-time fact,
     * distinct from student_enrollments.enrolled_at (which tracks each
     * academic year's class placement). Calculated from the student's
     * current class level during import; manually correctable afterward.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedSmallInteger('enrollment_year')->nullable()->after('date_of_birth');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('enrollment_year');
        });
    }
};
