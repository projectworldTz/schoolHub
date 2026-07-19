<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tenant registry. Owned by the Platform (Super Admin) layer — this
     * table itself is never school-scoped and carries no school_id column.
     */
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->default('secondary');
            $table->enum('status', ['pending', 'approved', 'suspended', 'rejected'])->default('pending');

            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('TZ');
            $table->string('timezone')->default('Africa/Dar_es_Salaam');
            $table->string('currency', 3)->default('TZS');
            $table->string('logo_path')->nullable();

            $table->string('subscription_plan')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
