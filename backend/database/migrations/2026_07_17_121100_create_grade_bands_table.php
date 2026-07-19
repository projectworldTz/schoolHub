<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A score range within a grading system (e.g. "A" = 80-100). No
     * school_id of its own — always reached through an already
     * tenant-scoped grading_systems row.
     */
    public function up(): void
    {
        Schema::create('grade_bands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grading_system_id');
            $table->string('label');
            $table->unsignedTinyInteger('min_score');
            $table->unsignedTinyInteger('max_score');
            $table->string('remark')->nullable();
            $table->decimal('gpa', 3, 2)->nullable();
            $table->timestamps();

            $table->foreign('grading_system_id')->references('id')->on('grading_systems')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_bands');
    }
};
