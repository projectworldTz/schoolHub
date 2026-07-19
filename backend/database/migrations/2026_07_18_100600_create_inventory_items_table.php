<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * quantity is a stored running total, adjusted by each
     * InventoryTransaction — same pattern as Book.available_copies.
     */
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('unit')->nullable();
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('reorder_level')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
