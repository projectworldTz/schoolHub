<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

class AppNotificationTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_user_can_list_and_mark_their_own_notifications_read(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $user = $this->createUser($school, 'School Owner');
        $notification = AppNotification::create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'type' => 'announcement',
            'title' => 'School closed',
            'message' => 'School is closed tomorrow.',
        ]);

        $this->actingAs($user, 'web')->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonPath('data.0.id', $notification->id);

        $this->actingAs($user, 'web')->patchJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('id', $notification->id);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_read_another_users_notification_in_the_same_school(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $first = $this->createUser($school, 'School Owner');
        $second = $this->createUser($school, 'Teacher');
        $notification = AppNotification::create([
            'school_id' => $school->id,
            'user_id' => $second->id,
            'type' => 'announcement',
            'title' => 'Private',
            'message' => 'Only the recipient can read this.',
        ]);

        $this->actingAs($first, 'web')->patchJson("/api/notifications/{$notification->id}/read")
            ->assertNotFound();

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_notifications_never_cross_school_boundaries(): void
    {
        $this->seedPermissions();
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        $userA = $this->createUser($schoolA, 'School Owner');
        $userB = $this->createUser($schoolB, 'School Owner');
        $notificationB = AppNotification::create([
            'school_id' => $schoolB->id,
            'user_id' => $userB->id,
            'type' => 'payment_confirmation',
            'title' => 'Payment received',
            'message' => 'School B only.',
        ]);

        $this->actingAs($userA, 'web')->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->actingAs($userA, 'web')->patchJson("/api/notifications/{$notificationB->id}/read")
            ->assertNotFound();
    }

    public function test_mark_all_only_changes_the_authenticated_users_notifications(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $first = $this->createUser($school, 'School Owner');
        $second = $this->createUser($school, 'Teacher');
        $own = AppNotification::create([
            'school_id' => $school->id, 'user_id' => $first->id, 'type' => 'announcement',
            'title' => 'Mine', 'message' => 'Mine.',
        ]);
        $other = AppNotification::create([
            'school_id' => $school->id, 'user_id' => $second->id, 'type' => 'announcement',
            'title' => 'Other', 'message' => 'Other.',
        ]);

        $this->actingAs($first, 'web')->patchJson('/api/notifications/read-all')->assertNoContent();

        $this->assertNotNull($own->fresh()->read_at);
        $this->assertNull($other->fresh()->read_at);
    }
}
