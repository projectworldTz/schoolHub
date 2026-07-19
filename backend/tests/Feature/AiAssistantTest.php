<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * The AI Assistant deliberately degrades to a clear "not configured" state
 * (503, not a crash) when no ANTHROPIC_API_KEY is set — the default in
 * every environment until a school's platform admin adds one, same as the
 * payment-gateway/SMS work. Http::fake() stands in for the real Anthropic
 * API in every "configured" test, so these never make a real network call.
 */
class AiAssistantTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_status_reports_not_configured_by_default(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $owner = $this->createUser($school, 'School Owner');

        $response = $this->actingAs($owner, 'web')->getJson('/api/school/ai-assistant/status');

        $response->assertOk()->assertJson(['data' => ['configured' => false]]);
    }

    public function test_a_student_role_cannot_use_the_assistant(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $student = $this->createUser($school, 'Student');

        $response = $this->actingAs($student, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'user', 'content' => 'Hello']],
        ]);

        $response->assertForbidden();
    }

    public function test_chat_returns_service_unavailable_when_not_configured(): void
    {
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'user', 'content' => 'Give me a warm-up activity for algebra.']],
        ]);

        $response->assertStatus(503);
    }

    public function test_chat_validates_message_shape(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'system', 'content' => 'Not allowed']],
        ]);

        $response->assertStatus(422);
    }

    public function test_chat_returns_the_assistant_reply_when_configured(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        Http::fake([
            'api.anthropic.com/*' => Http::response([
                'content' => [['type' => 'text', 'text' => 'Try a 5-minute mental-math warm-up before the lesson.']],
            ]),
        ]);
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'user', 'content' => 'Give me a warm-up activity for algebra.']],
        ]);

        $response->assertOk()->assertJson(['data' => ['reply' => 'Try a 5-minute mental-math warm-up before the lesson.']]);
        Http::assertSent(fn ($request) => $request->hasHeader('x-api-key', 'test-key'));
    }

    public function test_chat_reports_a_gateway_error_when_the_provider_fails(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        Http::fake(['api.anthropic.com/*' => Http::response(['error' => 'rate limited'], 429)]);
        $this->seedPermissions();
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/ai-assistant/chat', [
            'messages' => [['role' => 'user', 'content' => 'Hello']],
        ]);

        $response->assertStatus(502);
    }

    public function test_lesson_plan_generates_a_structured_plan_when_configured(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $planJson = json_encode([
            'title' => 'Introduction to Fractions',
            'objectives' => ['Students can identify numerator and denominator'],
            'materials' => ['Whiteboard', 'Fraction tiles'],
            'activities' => [['name' => 'Warm-up', 'duration_minutes' => 5, 'description' => 'Quick recap of whole numbers']],
            'assessment' => 'Exit ticket with 3 fraction questions',
            'homework' => 'Worksheet 3B',
        ]);
        Http::fake([
            // The real model sometimes wraps JSON in a fenced code block —
            // exercising that here confirms stripCodeFences() actually runs.
            'api.anthropic.com/*' => Http::response(['content' => [['type' => 'text', 'text' => "```json\n{$planJson}\n```"]]]),
        ]);
        $this->seedPermissions();
        $fixture = $this->setUpSchoolWithClass();
        $teacher = $this->createUser($fixture['school'], 'Teacher');

        $response = $this->actingAs($teacher, 'web')->postJson('/api/school/ai-assistant/lesson-plan', [
            'subject_id' => $fixture['subject']->id,
            'school_class_id' => $fixture['schoolClass']->id,
            'topic' => 'Fractions',
            'duration_minutes' => 40,
        ]);

        $response->assertOk();
        $this->assertSame('Introduction to Fractions', $response->json('data.title'));
        $this->assertCount(1, $response->json('data.activities'));
    }

    public function test_lesson_plan_rejects_a_subject_belonging_to_another_school(): void
    {
        Config::set('services.anthropic.key', 'test-key');
        $this->seedPermissions();
        $fixtureA = $this->setUpSchoolWithClass();
        $fixtureB = $this->setUpSchoolWithClass();
        $teacherA = $this->createUser($fixtureA['school'], 'Teacher');

        $response = $this->actingAs($teacherA, 'web')->postJson('/api/school/ai-assistant/lesson-plan', [
            'subject_id' => $fixtureB['subject']->id,
            'school_class_id' => $fixtureA['schoolClass']->id,
            'topic' => 'Fractions',
            'duration_minutes' => 40,
        ]);

        $response->assertNotFound();
    }
}
