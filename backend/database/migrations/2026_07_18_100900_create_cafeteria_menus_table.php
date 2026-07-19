<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cafeteria_menus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->date('menu_date');
            $table->enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack'])->default('lunch');
            $table->text('description');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->unique(['school_id', 'menu_date', 'meal_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cafeteria_menus');
    }
};
