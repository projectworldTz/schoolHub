<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_subjects', function (Blueprint $table) {
            // Set once, the first time a teacher submits this gradebook —
            // never overwritten by later saves. Drives the 24-hour edit
            // grace period; null means "never submitted, freely editable".
            $table->timestamp('submitted_at')->nullable()->after('exam_date');
        });
    }

    public function down(): void
    {
        Schema::table('exam_subjects', function (Blueprint $table) {
            $table->dropColumn('submitted_at');
        });
    }
};
