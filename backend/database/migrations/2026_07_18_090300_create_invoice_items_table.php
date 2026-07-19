<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');
            $table->uuid('fee_structure_id')->nullable();
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->cascadeOnDelete();
            $table->foreign('fee_structure_id')->references('id')->on('fee_structures')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
