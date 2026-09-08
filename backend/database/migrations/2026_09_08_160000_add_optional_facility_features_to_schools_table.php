<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->boolean('library_enabled')->default(true);
            $table->boolean('hostel_enabled')->default(true);
            $table->boolean('transport_enabled')->default(true);
            $table->boolean('cafeteria_enabled')->default(true);
            $table->boolean('clinic_enabled')->default(true);
            $table->boolean('inventory_enabled')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['library_enabled', 'hostel_enabled', 'transport_enabled', 'cafeteria_enabled', 'clinic_enabled', 'inventory_enabled']);
        });
    }
};
