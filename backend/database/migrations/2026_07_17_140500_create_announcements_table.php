<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Delivery channel is deliberately not modeled here — in-app (this
     * table, read by whoever the audience resolves to) is the only channel
     * actually wired up. Email/SMS/WhatsApp per ROADMAP.md Phase 3 need a
     * provider integration (SMTP creds, Africa's Talking/Twilio, WhatsApp
     * Business API) the same way Phase 5 payment gateways need Stripe/
     * Flutterwave/M-Pesa credentials — deferred until those are supplied.
     */
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->string('title');
            $table->text('body');
            $table->enum('audience', ['school', 'class', 'role'])->default('school');
            $table->uuid('school_class_id')->nullable();
            $table->string('role')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('school_class_id')->references('id')->on('school_classes')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['school_id', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
