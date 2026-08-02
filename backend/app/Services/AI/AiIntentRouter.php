<?php

namespace App\Services\AI;

use App\Models\User;
use App\Services\AI\Tools\AttendanceTool;
use App\Services\AI\Tools\ExamPerformanceSummaryTool;
use App\Services\AI\Tools\OutstandingFeesTool;
use App\Services\AI\Tools\TimetableTool;

/**
 * Builds the routing prompt and parses+validates the model's answer — it
 * never makes the AI call itself (AiAssistantService::call() already does
 * that for both this and the final-answer step, reusing the exact same
 * provider methods). The model is only ever offered tools this user is
 * already authorized to use, and its answer is validated against that same
 * fixed list — an intent name it invents, or one for a tool it wasn't
 * offered, is never trusted, just treated as "general".
 */
class AiIntentRouter
{
    public function __construct(protected AiAuthorizationService $authorization) {}

    /** @return array<int, array{name: string, description: string, params: array<string, string>}> */
    public function availableTools(User $user): array
    {
        $tools = [];

        if ($this->authorization->canUseAttendanceTool($user)) {
            $tools[] = [
                'name' => AttendanceTool::name(),
                'description' => 'How many students were absent on a given date (defaults to today), optionally for one class.',
                'params' => ['date' => 'YYYY-MM-DD, optional', 'class_name' => 'optional'],
            ];
        }

        if ($this->authorization->canUseFeesTool($user)) {
            $tools[] = [
                'name' => OutstandingFeesTool::name(),
                'description' => 'Students with an outstanding (unpaid) fee balance, optionally filtered to one class.',
                'params' => ['class_name' => 'optional'],
            ];
        }

        if ($this->authorization->canUseExamPerformanceTool($user)) {
            $tools[] = [
                'name' => ExamPerformanceSummaryTool::name(),
                'description' => 'Class average, pass rate, and strongest/weakest subjects for a completed examination.',
                'params' => ['class_name' => 'optional', 'exam_name' => 'optional'],
            ];
        }

        // A user's own timetable needs no extra permission — always offered.
        $tools[] = [
            'name' => TimetableTool::name(),
            'description' => "The asking user's own weekly timetable, or — for classes.manage holders — a named class's timetable.",
            'params' => ['class_name' => "optional, another class's timetable"],
        ];

        return $tools;
    }

    /** @param  array<int, array{name: string, description: string, params: array<string, string>}>  $tools */
    public function buildRoutingPrompt(array $tools, array $context): string
    {
        $toolList = collect($tools)->map(function (array $tool) {
            $params = collect($tool['params'])
                ->map(fn (string $desc, string $key) => "{$key} ({$desc})")
                ->implode(', ') ?: 'none';

            return "- {$tool['name']}: {$tool['description']} (parameters: {$params})";
        })->implode("\n");

        return "You are an intent router for the SchoolHub AI assistant. Context: ".json_encode($context)."\n\n".
            "Available tools:\n{$toolList}\n\n".
            'Read the user\'s latest message. If it clearly matches one of the tools above, respond with ONLY this '.
            'JSON (no markdown, no prose, nothing else): {"intent": "<tool name>", "parameters": {...}}. Extract '.
            'parameter values from the message as plain text (e.g. a class name like "Form Two Blue") — you have no '.
            'database IDs, never invent one. If the message is a general question, a greeting, or doesn\'t clearly '.
            'match any tool above, respond with exactly {"intent": "general", "parameters": {}}. Never invent a tool '.
            'name that isn\'t in the list above.';
    }

    /**
     * @param  array<int, array{name: string, description: string, params: array<string, string>}>  $tools
     * @return array{intent: string, parameters: array<string, mixed>}
     */
    public function parseIntent(string $rawReply, array $tools): array
    {
        $decoded = json_decode($this->stripCodeFences($rawReply), true);
        $validIntents = collect($tools)->pluck('name')->all();

        if (! is_array($decoded) || ! in_array($decoded['intent'] ?? null, $validIntents, true)) {
            return ['intent' => 'general', 'parameters' => []];
        }

        return [
            'intent' => $decoded['intent'],
            'parameters' => is_array($decoded['parameters'] ?? null) ? $decoded['parameters'] : [],
        ];
    }

    protected function stripCodeFences(string $text): string
    {
        return trim(preg_replace('/^```(?:json)?|```$/m', '', trim($text)));
    }
}
