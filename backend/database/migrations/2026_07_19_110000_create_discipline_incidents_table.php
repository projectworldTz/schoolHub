<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discipline_incidents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->date('incident_date');
            $table->string('category');
            $table->enum('severity', ['minor', 'moderate', 'major'])->default('minor');
            $table->text('description');
            $table->text('action_taken')->nullable();
            $table->enum('status', ['open', 'resolved'])->default('open');
            $table->uuid('reported_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('reported_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discipline_incidents');
    }
};
