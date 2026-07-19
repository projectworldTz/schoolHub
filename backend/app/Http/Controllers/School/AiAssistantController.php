<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AiChatRequest;
use App\Http\Requests\School\GenerateLessonPlanRequest;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Services\School\AiAssistantService;
use Illuminate\Http\Request;
use RuntimeException;

class AiAssistantController extends Controller
{
    public function __construct(protected AiAssistantService $assistant) {}

    public function status(Request $request)
    {
        abort_unless($request->user()->can('ai-assistant.use'), 403);

        return response()->json(['data' => ['configured' => $this->assistant->isConfigured()]]);
    }

    public function chat(AiChatRequest $request)
    {
        $this->ensureConfigured();

        try {
            $reply = $this->assistant->chat($request->validated('messages'), $this->currentSchool($request), $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['data' => ['reply' => $reply]]);
    }

    public function lessonPlan(GenerateLessonPlanRequest $request)
    {
        $this->ensureConfigured();

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
            ], $this->currentSchool($request), $request->user());
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

    protected function currentSchool(Request $request): School
    {
        abort_unless($request->user()->school_id, 403, 'This account is not attached to a school.');

        return School::findOrFail($request->user()->school_id);
    }
}
