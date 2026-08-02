<?php

namespace Tests\Feature;

use App\Models\AiAuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * The AI Assistant is a premium, per-school feature (App\Models\School's
 * ai_* columns, App\Services\AI\AiPremiumAccessService) gated independently
 * of the ai-assistant.use permission already covered by AiAssistantTest.
 * SetsUpTenant::createSchool() defaults to a granted+active school so every
 * other AI test suite keeps working — these tests explicitly override that
 * default to exercise each locked state.
 */
class AiPremiumAccessTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    protected function chat(\App\Models\User $user): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'user', 'content' => 'Hello']],
        ]);
    }

    public function test_chat_is_blocked_when_ai_access_was_never_granted(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $school = $this->createSchool(['ai_enabled' => false, 'ai_activated_at' => null]);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->chat($teacher);

        $response->assertStatus(403)->assertJson([
            'success' => false,
            'code' => 'AI_ACCESS_NOT_GRANTED',
        ]);
        Http::assertNothingSent();
    }

    public function test_chat_is_blocked_when_the_activation_date_is_in_the_future(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $school = $this->createSchool(['ai_enabled' => true, 'ai_activated_at' => now()->addWeek()]);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->chat($teacher);

        $response->assertStatus(403)->assertJson(['code' => 'AI_ACCESS_NOT_GRANTED']);
    }

    public function test_chat_is_blocked_when_suspended(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $school = $this->createSchool([
            'ai_enabled' => true,
            'ai_activated_at' => now()->subMonth(),
            'ai_suspended_at' => now(),
            'ai_suspension_reason' => 'Overdue invoice',
        ]);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->chat($teacher);

        $response->assertStatus(403)->assertJson(['code' => 'AI_ACCESS_SUSPENDED']);
    }

    public function test_chat_is_blocked_when_expired(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $school = $this->createSchool([
            'ai_enabled' => true,
            'ai_activated_at' => now()->subMonths(2),
            'ai_expires_at' => now()->subDay(),
        ]);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->chat($teacher);

        $response->assertStatus(403)->assertJson(['code' => 'AI_ACCESS_EXPIRED']);
    }

    public function test_chat_is_blocked_once_the_monthly_usage_limit_is_reached(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $school = $this->createSchool(['ai_monthly_request_limit' => 1]);
        $teacher = $this->createUser($school, 'Teacher');

        AiAuditLog::create([
            'school_id' => $school->id,
            'user_id' => $teacher->id,
            'intent' => 'general',
            'status' => 'success',
        ]);

        $response = $this->chat($teacher);

        $response->assertStatus(429)->assertJson(['code' => 'AI_USAGE_LIMIT_REACHED']);
        Http::assertNothingSent();
    }

    public function test_chat_succeeds_when_active_and_under_the_usage_limit(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        Http::fake([
            'api.anthropic.com/*' => Http::response(['content' => [['type' => 'text', 'text' => 'Hi there.']]]),
        ]);
        $this->seedPermissions();
        $school = $this->createSchool(['ai_monthly_request_limit' => 5]);
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->chat($teacher);

        $response->assertOk()->assertJson(['data' => ['reply' => 'Hi there.']]);
    }

    public function test_status_reports_each_access_state_without_throwing(): void
    {
        $this->seedPermissions();

        $notGranted = $this->createSchool(['ai_enabled' => false, 'ai_activated_at' => null]);
        $suspended = $this->createSchool(['ai_enabled' => true, 'ai_activated_at' => now()->subMonth(), 'ai_suspended_at' => now()]);
        $expired = $this->createSchool(['ai_enabled' => true, 'ai_activated_at' => now()->subMonths(2), 'ai_expires_at' => now()->subDay()]);
        $active = $this->createSchool();

        foreach ([
            [$notGranted, 'not_granted'],
            [$suspended, 'suspended'],
            [$expired, 'expired'],
            [$active, 'active'],
        ] as [$school, $expectedStatus]) {
            $owner = $this->createUser($school, 'School Owner');
            $response = $this->actingAs($owner, 'web')->getJson('/api/school/ai-assistant/status');

            $response->assertOk()->assertJsonPath('data.access.status', $expectedStatus);
        }
    }

    public function test_a_super_admin_can_grant_ai_access(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool(['ai_enabled' => false, 'ai_activated_at' => null]);

        $response = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/ai-access/grant", [
            'monthly_request_limit' => 100,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.ai_access_status', 'active');
        $response->assertJsonPath('data.ai_monthly_request_limit', 100);
        $this->assertSame($superAdmin->id, $school->fresh()->ai_access_updated_by);
    }

    public function test_a_non_super_admin_cannot_grant_ai_access(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool(['ai_enabled' => false, 'ai_activated_at' => null]);
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->postJson("/api/platform/schools/{$school->id}/ai-access/grant", []);

        $response->assertForbidden();
    }

    public function test_a_super_admin_can_suspend_reactivate_and_revoke_ai_access(): void
    {
        $this->seedPermissions();
        $superAdmin = $this->createUser($this->createSchool(), 'Super Admin');
        $school = $this->createSchool();

        $suspend = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/ai-access/suspend", [
            'reason' => 'Payment overdue',
        ]);
        $suspend->assertOk()->assertJsonPath('data.ai_access_status', 'suspended');

        $reactivate = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/ai-access/reactivate");
        $reactivate->assertOk()->assertJsonPath('data.ai_access_status', 'active');

        $revoke = $this->actingAs($superAdmin, 'web')->postJson("/api/platform/schools/{$school->id}/ai-access/revoke");
        $revoke->assertOk()->assertJsonPath('data.ai_access_status', 'not_granted');
    }
}
