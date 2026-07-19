<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Class" as in grade/form level (e.g. "Form 1", "Grade 5") — named
     * SchoolClass/school_classes because `class` is a reserved word in PHP
     * and cannot be used as a model name.
     */
    public function up(): void
    {
        Schema::create('school_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->string('name');
            $table->unsignedSmallInteger('level')->comment('Ordering/sequence, e.g. Form 1 = 1, Form 2 = 2');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->unique(['school_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_classes');
    }
};
