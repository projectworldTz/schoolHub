<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Curriculum: which subjects are taught at which class level. No
     * school_id of its own — always reached through an already
     * tenant-scoped school_classes row (see SchoolClass::subjects()).
     */
    public function up(): void
    {
        Schema::create('class_subject', function (Blueprint $table) {
            $table->uuid('school_class_id');
            $table->uuid('subject_id');
            $table->timestamps();

            $table->primary(['school_class_id', 'subject_id']);
            $table->foreign('school_class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_subject');
    }
};
