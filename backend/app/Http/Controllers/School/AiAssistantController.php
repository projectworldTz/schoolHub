<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AiChatRequest;
use App\Http\Requests\School\GenerateLessonPlanRequest;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Services\AI\AiPremiumAccessService;
use App\Services\School\AiAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AiAssistantController extends Controller
{
    public function __construct(
        protected AiAssistantService $assistant,
        protected AiPremiumAccessService $premiumAccess,
    ) {}

    public function status(Request $request)
    {
        abort_unless($request->user()->can('ai-assistant.use'), 403);

        $access = $this->premiumAccess->evaluate($this->currentSchool($request));

        return response()->json(['data' => [
            'configured' => $this->assistant->isConfigured(),
            'access' => $access,
        ]]);
    }

    public function chat(AiChatRequest $request)
    {
        $this->ensureConfigured();
        $school = $this->currentSchool($request);

        if ($denied = $this->accessDenialResponse($school)) {
            return $denied;
        }

        try {
            $result = $this->assistant->chat($request->validated('messages'), $school, $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['data' => $result]);
    }

    public function lessonPlan(GenerateLessonPlanRequest $request)
    {
        $this->ensureConfigured();
        $school = $this->currentSchool($request);

        if ($denied = $this->accessDenialResponse($school)) {
            return $denied;
        }

        $data = $request->validated();

        // Eloquent findOrFail — tenant-scoped via BelongsToSchool, so an id
        // for another school's subject/class 404s here regardless of what
        // the request's own 'exists' rule already confirmed.
        $subject = Subject::findOrFail($data['subject_id']);
        $schoolClass = SchoolClass::findOrFail($data['school_class_id']);

        try {
            $plan = $this->assistant->generateLessonPlan([
                'subject_name' => $subject->name,
                'class_name' => $schoolClass->name,
                'topic' => $data['topic'],
                'duration_minutes' => $data['duration_minutes'],
                'notes' => $data['notes'] ?? null,
            ], $school, $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['data' => $plan]);
    }

    protected function ensureConfigured(): void
    {
        abort_unless(
            $this->assistant->isConfigured(),
            503,
            'The AI Assistant is not configured yet. Ask your platform administrator to add an API key.'
        );
    }

    /**
     * Backend enforcement of the premium AI gate — checked here, not just
     * hidden in the frontend. Returns null when the request may proceed.
     */
    protected function accessDenialResponse(School $school): ?JsonResponse
    {
        $access = $this->premiumAccess->evaluate($school);

        if ($access['code'] === null) {
            return null;
        }

        return response()->json([
            'success' => false,
            'code' => $access['code'],
            'message' => $access['message'],
        ], $access['code'] === 'AI_USAGE_LIMIT_REACHED' ? 429 : 403);
    }

    protected function currentSchool(Request $request): School
    {
        abort_unless($request->user()->school_id, 403, 'This account is not attached to a school.');

        return School::findOrFail($request->user()->school_id);
    }
}
