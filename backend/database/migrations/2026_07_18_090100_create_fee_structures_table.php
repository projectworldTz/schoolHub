<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A null school_class_id means the fee applies to every class in that
     * academic year/term (e.g. a school-wide "Registration Fee") rather
     * than needing one row per class.
     */
    public function up(): void
    {
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('academic_year_id');
            $table->uuid('term_id')->nullable();
            $table->uuid('school_class_id')->nullable();
            $table->uuid('fee_category_id');
            $table->decimal('amount', 12, 2);
            $table->date('due_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('term_id')->references('id')->on('terms')->nullOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->nullOnDelete();
            $table->foreign('fee_category_id')->references('id')->on('fee_categories')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_structures');
    }
};
