<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grading_systems', function (Blueprint $table) {
            $table->boolean('necta_enabled')->default(false)->after('is_default');
            $table->unsignedTinyInteger('points_subject_count')->nullable()->after('necta_enabled');
            $table->json('division_rules')->nullable()->after('points_subject_count');
            $table->json('assessment_weights')->nullable()->after('division_rules');
        });
        Schema::table('grade_bands', fn (Blueprint $table) => $table->unsignedTinyInteger('points')->nullable()->after('gpa'));
    }

    public function down(): void
    {
        Schema::table('grade_bands', fn (Blueprint $table) => $table->dropColumn('points'));
        Schema::table('grading_systems', fn (Blueprint $table) => $table->dropColumn([
            'necta_enabled', 'points_subject_count', 'division_rules', 'assessment_weights',
        ]));
    }
};
