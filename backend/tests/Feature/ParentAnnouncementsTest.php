<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Guardian;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Guards the Parent Portal's unread-announcements badge: "unread" is
 * computed against the guardian's own last-visit marker, not a global flag,
 * and viewing the list resets that marker so previously-new items don't
 * stay flagged forever.
 */
class ParentAnnouncementsTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function linkParent(\App\Models\School $school, \App\Models\Student $student): \App\Models\User
    {
        $guardian = Guardian::create(['school_id' => $school->id, 'name' => 'Test Guardian']);
        $guardian->students()->attach($student->id, ['relationship' => 'mother', 'is_primary' => true]);
        $parentUser = $this->createUser($school, 'Parent');
        $guardian->update(['user_id' => $parentUser->id]);

        return $parentUser;
    }

    public function test_a_new_announcement_is_marked_unread_until_the_parent_views_it(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $parent = $this->linkParent($fixture['school'], $fixture['students']->first());

        Announcement::create([
            'school_id' => $fixture['school']->id,
            'title' => 'School Reopening',
            'body' => 'Classes resume Monday.',
            'audience' => 'school',
            'published_at' => now(),
        ]);

        $first = $this->actingAs($parent, 'web')->getJson('/api/parent/announcements');
        $first->assertOk();
        $this->assertSame(1, $first->json('meta.unread_count'));
        $this->assertTrue($first->json('data.0.is_new'));

        $second = $this->actingAs($parent, 'web')->getJson('/api/parent/announcements');
        $second->assertOk();
        $this->assertSame(0, $second->json('meta.unread_count'));
        $this->assertFalse($second->json('data.0.is_new'));
    }

    public function test_only_the_newly_published_announcement_counts_as_unread_on_a_later_visit(): void
    {
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass(studentCount: 1);
        $parent = $this->linkParent($fixture['school'], $fixture['students']->first());

        Announcement::create([
            'school_id' => $fixture['school']->id,
            'title' => 'Old News',
            'body' => 'Already seen.',
            'audience' => 'school',
            'published_at' => now(),
        ]);

        $this->actingAs($parent, 'web')->getJson('/api/parent/announcements')->assertOk();

        Announcement::create([
            'school_id' => $fixture['school']->id,
            'title' => 'Fresh News',
            'body' => 'Just published.',
            'audience' => 'school',
            'published_at' => now()->addMinute(),
        ]);

        $response = $this->actingAs($parent, 'web')->getJson('/api/parent/announcements');
        $response->assertOk();
        $this->assertSame(1, $response->json('meta.unread_count'));

        $fresh = collect($response->json('data'))->firstWhere('title', 'Fresh News');
        $old = collect($response->json('data'))->firstWhere('title', 'Old News');
        $this->assertTrue($fresh['is_new']);
        $this->assertFalse($old['is_new']);
    }
}
