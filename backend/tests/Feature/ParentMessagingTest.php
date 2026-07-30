<?php

namespace Tests\Feature;

use App\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the parent-messaging rules added alongside the teacher-class
 * scoping work: messaging a parent is admin-tier only (staff.manage), a
 * Parent can never initiate a conversation, and a Parent can only read/
 * reply within a conversation a staff member already started with them —
 * never one between two other users.
 */
class ParentMessagingTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_regular_teacher_cannot_start_a_conversation_with_a_parent(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');
        $parent = $this->createUser($school, 'Parent');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/conversations', [
            'recipient_id' => $parent->id,
        ]);

        $response->assertForbidden();
    }

    public function test_a_school_owner_can_start_a_conversation_with_a_parent(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $parent = $this->createUser($school, 'Parent');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/conversations', [
            'recipient_id' => $parent->id,
        ]);

        $response->assertCreated();
    }

    public function test_a_parent_cannot_start_a_conversation_at_all(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $parent = $this->createUser($school, 'Parent');
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($parent, 'web')->postJson('/api/school/conversations', [
            'recipient_id' => $owner->id,
        ]);

        $response->assertForbidden();
    }

    public function test_a_parent_can_read_and_reply_to_a_conversation_a_staff_member_started_with_them(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $parent = $this->createUser($school, 'Parent');
        // Conversation::between() infers school_id from Tenant::id(), which
        // is only set by an HTTP request going through ResolveTenantFromUser
        // — pass it explicitly here instead, per SetsUpTenant's convention
        // for models created outside of a real request.
        $conversation = Conversation::create([
            'school_id' => $school->id,
            'user_one_id' => $owner->id,
            'user_two_id' => $parent->id,
        ]);

        $list = $this->actingAs($parent, 'web')->getJson('/api/parent/conversations');
        $list->assertOk();
        $this->assertContains($conversation->id, collect($list->json('data'))->pluck('id')->all());

        $reply = $this->actingAs($parent, 'web')
            ->postJson("/api/parent/conversations/{$conversation->id}/messages", ['body' => 'Thank you']);
        $reply->assertCreated();
    }

    public function test_a_parent_cannot_read_a_conversation_they_are_not_part_of(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');
        $otherParent = $this->createUser($school, 'Parent');
        $conversation = Conversation::create([
            'school_id' => $school->id,
            'user_one_id' => $owner->id,
            'user_two_id' => $otherParent->id,
        ]);

        $outsiderParent = $this->createUser($school, 'Parent');

        $response = $this->actingAs($outsiderParent, 'web')
            ->getJson("/api/parent/conversations/{$conversation->id}/messages");

        $response->assertForbidden();
    }
}
