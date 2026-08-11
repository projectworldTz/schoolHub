<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->uuid('fee_category_id')->nullable()->after('invoice_id');
            $table->foreign('fee_category_id')->references('id')->on('fee_categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['fee_category_id']);
            $table->dropColumn('fee_category_id');
        });
    }
};
