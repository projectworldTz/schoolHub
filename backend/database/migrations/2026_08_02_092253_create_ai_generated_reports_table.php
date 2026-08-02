<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ai_generated_reports', function (Blueprint $table) {
            // The primary key itself is the public identifier used in the
            // signed download URL — same convention every other model in
            // this app already follows (HasUuids on the PK directly, no
            // separate obfuscation column).
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('user_id');
            $table->string('report_type');
            $table->string('title');
            $table->string('format', 10);
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->json('filters')->nullable();
            $table->string('status')->default('pending');
            $table->text('failure_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['school_id', 'created_at']);
            $table->index(['status', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generated_reports');
    }
};
