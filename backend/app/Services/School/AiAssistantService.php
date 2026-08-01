<?php

namespace App\Services\School;

use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * A thin wrapper around Anthropic's Messages API and/or Google's Gemini
 * API — whichever has a key configured (see provider()). Deliberately
 * stateless — every call carries its own full conversation/prompt, nothing
 * is persisted server-side — so there's no new data-retention surface to
 * reason about. Grounded only in the school's name and the asking user's
 * name/role; it is never given raw student/financial data to reason over,
 * so there is no cross-tenant leak risk even though the same API key is
 * shared by every school on the platform.
 */
class AiAssistantService
{
    public function isConfigured(): bool
    {
        return filled(config('services.anthropic.key')) || filled(config('services.gemini.key'));
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function chat(array $messages, School $school, User $user): string
    {
        return $this->call($this->systemPrompt($school, $user), $messages);
    }

    /**
     * @param  array{subject_name: string, class_name: string, topic: string, duration_minutes: int, notes: ?string}  $params
     * @return array{title: string, objectives: array<int, string>, materials: array<int, string>, activities: array<int, array{name: string, duration_minutes: int, description: string}>, assessment: string, homework: string}
     */
    public function generateLessonPlan(array $params, School $school, User $user): array
    {
        $system = $this->systemPrompt($school, $user)."\n\n".
            'You write structured lesson plans for teachers. Respond with ONLY a single JSON object '.
            '(no markdown code fences, no prose before or after) matching exactly this shape: '.
            '{"title": string, "objectives": string[], "materials": string[], '.
            '"activities": [{"name": string, "duration_minutes": number, "description": string}], '.
            '"assessment": string, "homework": string}. The activities\' duration_minutes must sum to '.
            'roughly the total lesson duration given.';

        $prompt = sprintf(
            "Create a lesson plan for:\nSubject: %s\nClass: %s\nTopic: %s\nTotal duration: %d minutes%s",
            $params['subject_name'],
            $params['class_name'],
            $params['topic'],
            $params['duration_minutes'],
            filled($params['notes']) ? "\nAdditional notes from the teacher: {$params['notes']}" : '',
        );

        $reply = $this->call($system, [['role' => 'user', 'content' => $prompt]]);
        $text = $this->stripCodeFences($reply);

        $plan = json_decode($text, true);

        if (! is_array($plan) || ! isset($plan['title'], $plan['objectives'], $plan['activities'])) {
            throw new RuntimeException('The AI response could not be read as a lesson plan. Please try again.');
        }

        return $plan;
    }

    /**
     * Anthropic wins if both keys are set — this is the only place that
     * decides, so switching providers is just filling in one env var
     * instead of the other, nothing else in this class cares which.
     */
    protected function provider(): string
    {
        return filled(config('services.anthropic.key')) ? 'anthropic' : 'gemini';
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    protected function call(string $system, array $messages): string
    {
        return match ($this->provider()) {
            'gemini' => $this->callGemini($system, $messages),
            default => $this->callAnthropic($system, $messages),
        };
    }

    /** @param  array<int, array{role: string, content: string}>  $messages */
    protected function callAnthropic(string $system, array $messages): string
    {
        $response = Http::withHeaders([
            'x-api-key' => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])
            ->timeout(45)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => config('services.anthropic.model'),
                'max_tokens' => 2000,
                'system' => $system,
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            Log::warning('AI assistant call failed', ['provider' => 'anthropic', 'status' => $response->status(), 'body' => $response->body()]);

            throw new RuntimeException('The AI assistant is temporarily unavailable. Please try again shortly.');
        }

        return collect($response->json('content') ?? [])
            ->where('type', 'text')
            ->pluck('text')
            ->implode('');
    }

    /**
     * Gemini has no separate "system" message slot in the chat history and
     * uses "model" rather than "assistant" for its own turns — both
     * translated here so the rest of this class stays provider-agnostic.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    protected function callGemini(string $system, array $messages): string
    {
        $contents = collect($messages)->map(fn (array $message) => [
            'role' => $message['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $message['content']]],
        ])->all();

        $model = config('services.gemini.model');

        $response = Http::withHeaders([
            'x-goog-api-key' => config('services.gemini.key'),
        ])
            ->timeout(45)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                'systemInstruction' => ['parts' => [['text' => $system]]],
                'contents' => $contents,
                'generationConfig' => ['maxOutputTokens' => 2000],
            ]);

        if ($response->failed()) {
            Log::warning('AI assistant call failed', ['provider' => 'gemini', 'status' => $response->status(), 'body' => $response->body()]);

            throw new RuntimeException('The AI assistant is temporarily unavailable. Please try again shortly.');
        }

        return collect($response->json('candidates.0.content.parts') ?? [])
            ->pluck('text')
            ->implode('');
    }

    protected function stripCodeFences(string $text): string
    {
        return trim(preg_replace('/^```(?:json)?|```$/m', '', trim($text)));
    }

    protected function systemPrompt(School $school, User $user): string
    {
        $role = $user->roles->pluck('name')->first() ?? 'staff member';

        return sprintf(
            'You are the AI assistant built into the school management system for %s, currently helping %s (%s). '.
            'Be concise and practical. Never invent student names, grades, attendance figures, or financial '.
            "numbers you weren't given in the conversation — if answering accurately needs real data you don't ".
            'have, say so and suggest where in the system to look, instead of guessing.',
            $school->name,
            $user->name,
            $role,
        );
    }
}
