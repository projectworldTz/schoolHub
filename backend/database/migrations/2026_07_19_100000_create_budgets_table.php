<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One budgeted amount per expense category per academic year — "actual"
 * is computed on read from the expenses table (sum of expenses in that
 * category dated within the academic year), not stored here, so there is
 * no running total to keep in sync.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('expense_category_id');
            $table->uuid('academic_year_id');
            $table->decimal('amount', 14, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('expense_category_id')->references('id')->on('expense_categories')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->unique(['expense_category_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
