<?php

namespace Tests\Feature;

use App\Models\WebsiteNews;
use Database\Seeders\Phase3PermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * Toggling Announcement.is_public_website is the school owner's one entry
 * point into the website_news table (see Announcement::booted()'s saved()
 * hook) — no separate "publish this to the site" step needed. This applies
 * regardless of whether the school actually has website_enabled: the sync
 * is unconditional, since the public site itself is what gates on
 * website_enabled (App\Http\Controllers\Public\WebsiteController), not this
 * sync.
 */
class AnnouncementPublicSyncTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPermissions();
        $this->seed(Phase3PermissionsSeeder::class); // announcements.manage — not part of the shared seedPermissions() bundle
    }

    public function test_marking_an_announcement_public_creates_a_website_news_row(): void
    {
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/announcements', [
            'title' => 'Sports Day',
            'body' => 'Join us for the annual sports day.',
            'audience' => 'school',
            'is_public_website' => true,
        ]);

        $response->assertCreated();
        $announcementId = $response->json('data.id');
        $this->assertSame(1, WebsiteNews::where('announcement_id', $announcementId)->count());
    }

    public function test_unmarking_an_announcement_public_removes_the_website_news_row(): void
    {
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $create = $this->actingAs($owner, 'web')->postJson('/api/school/announcements', [
            'title' => 'Sports Day',
            'body' => 'Join us for the annual sports day.',
            'audience' => 'school',
            'is_public_website' => true,
        ]);
        $announcementId = $create->json('data.id');
        $this->assertSame(1, WebsiteNews::where('announcement_id', $announcementId)->count());

        $this->actingAs($owner, 'web')->putJson("/api/school/announcements/{$announcementId}", [
            'title' => 'Sports Day',
            'body' => 'Join us for the annual sports day.',
            'audience' => 'school',
            'is_public_website' => false,
        ])->assertOk();

        $this->assertSame(0, WebsiteNews::where('announcement_id', $announcementId)->count());
    }

    public function test_a_default_announcement_is_not_public(): void
    {
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson('/api/school/announcements', [
            'title' => 'Internal memo',
            'body' => 'Staff meeting at 3pm.',
            'audience' => 'school',
        ]);

        $response->assertCreated()->assertJsonPath('data.is_public_website', false);
        $this->assertSame(0, WebsiteNews::where('announcement_id', $response->json('data.id'))->count());
    }
}
