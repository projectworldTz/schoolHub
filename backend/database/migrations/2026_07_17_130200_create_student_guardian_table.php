<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_guardian', function (Blueprint $table) {
            $table->uuid('student_id');
            $table->uuid('guardian_id');
            $table->string('relationship')->default('guardian');
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_emergency_contact')->default(false);
            $table->timestamps();

            $table->primary(['student_id', 'guardian_id']);
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('guardian_id')->references('id')->on('guardians')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_guardian');
    }
};
