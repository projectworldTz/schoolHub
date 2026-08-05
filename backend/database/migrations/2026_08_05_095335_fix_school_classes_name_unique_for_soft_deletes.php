<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The original unique(school_id, name) index counted soft-deleted rows,
     * so recreating a class with the same name as a deleted one failed with
     * "the name has been taken". Folding deleted_at into the index lets a
     * soft-deleted row's name be reused; true duplicate-active-name
     * protection now lives in SchoolClassRequest's withoutTrashed() check.
     */
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            // Added before the drop: the old index is also what backs the
            // school_id foreign key, so MySQL refuses to drop it otherwise.
            $table->unique(['school_id', 'name', 'deleted_at']);
            $table->dropUnique(['school_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->unique(['school_id', 'name']);
            $table->dropUnique(['school_id', 'name', 'deleted_at']);
        });
    }
};
