<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\GenerateExamPaperRequest;
use App\Http\Requests\School\RefineExamPaperRequest;
use App\Http\Requests\School\UpdateExamPaperRequest;
use App\Models\ExamPaper;
use App\Models\School;
use App\Services\AI\AiPremiumAccessService;
use App\Services\School\AiAssistantService;
use App\Services\School\ExamPaperService;
use App\Support\Tenancy\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class ExamPaperController extends Controller
{
    public function __construct(
        protected ExamPaperService $examPapers,
        protected AiAssistantService $assistant,
        protected AiPremiumAccessService $premiumAccess,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $query = ExamPaper::query()->with(['subject', 'schoolClass'])->latest();

        if (! $user->can('exams.manage')) {
            $query->where('created_by', $user->id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function generate(GenerateExamPaperRequest $request)
    {
        $this->ensureConfigured();
        $school = $this->currentSchool($request);
        $user = $request->user();
        $data = $request->validated();

        abort_unless($user->canAccessClass($data['school_class_id']), 403);

        if ($denied = $this->accessDenialResponse($school)) {
            return $denied;
        }

        try {
            $paper = $this->examPapers->generate($data, $school, $user);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['data' => $paper], 201);
    }

    public function show(Request $request, ExamPaper $examPaper)
    {
        $this->authorizeAccess($request, $examPaper);

        return response()->json(['data' => $examPaper]);
    }

    public function update(UpdateExamPaperRequest $request, ExamPaper $examPaper)
    {
        $this->authorizeAccess($request, $examPaper);

        $paper = $this->examPapers->applyManualEdit($examPaper, $request->validated());

        return response()->json(['data' => $paper]);
    }

    public function refine(RefineExamPaperRequest $request, ExamPaper $examPaper)
    {
        $this->ensureConfigured();
        $this->authorizeAccess($request, $examPaper);
        $school = $this->currentSchool($request);

        if ($denied = $this->accessDenialResponse($school)) {
            return $denied;
        }

        try {
            $paper = $this->examPapers->refine($examPaper, $request->validated('instruction'), $school, $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['data' => $paper]);
    }

    public function finalize(Request $request, ExamPaper $examPaper)
    {
        $this->authorizeAccess($request, $examPaper);

        return response()->json(['data' => $this->examPapers->finalize($examPaper)]);
    }

    public function pdf(Request $request, ExamPaper $examPaper, string $type)
    {
        $this->authorizeAccess($request, $examPaper);
        abort_unless(in_array($type, ['paper', 'marking-scheme'], true), 404);

        $examPaper->load(['subject', 'schoolClass']);
        $school = $this->currentSchool($request);

        $view = $type === 'paper' ? 'documents.exam-paper' : 'documents.exam-marking-scheme';
        $suffix = $type === 'paper' ? 'exam-paper' : 'marking-scheme';

        $pdf = Pdf::loadView($view, [
            'school' => $school,
            'examPaper' => $examPaper,
        ])->setPaper('a4');

        return $pdf->download(Str::slug($examPaper->title.'-'.$suffix).'.pdf');
    }

    public function destroy(Request $request, ExamPaper $examPaper)
    {
        $this->authorizeAccess($request, $examPaper);
        $examPaper->delete();

        return response()->json(null, 204);
    }

    protected function authorizeAccess(Request $request, ExamPaper $examPaper): void
    {
        $user = $request->user();

        abort_unless($user->can('exam-marks.record') || $user->can('exams.manage'), 403);
        abort_unless($user->can('exams.manage') || $examPaper->created_by === $user->id, 403);
        abort_unless($user->canAccessClass($examPaper->school_class_id), 403);
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
        abort_unless(Tenant::id(), 403, 'This account is not attached to a school.');

        return School::findOrFail(Tenant::id());
    }
}
