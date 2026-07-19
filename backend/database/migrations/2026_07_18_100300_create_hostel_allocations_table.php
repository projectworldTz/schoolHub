<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Multiple rows per student are allowed on purpose (room changes are
     * history, not overwrites) — exactly one 'active' row per student at a
     * time is enforced in HostelService, not the schema, same pattern as
     * student_enrollments.
     */
    public function up(): void
    {
        Schema::create('hostel_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');
            $table->uuid('student_id');
            $table->uuid('hostel_room_id');
            $table->uuid('academic_year_id');
            $table->date('allocated_at');
            $table->date('vacated_at')->nullable();
            $table->enum('status', ['active', 'vacated'])->default('active');
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('hostel_room_id')->references('id')->on('hostel_rooms')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->index(['student_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_allocations');
    }
};
