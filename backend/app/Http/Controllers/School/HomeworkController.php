<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\HomeworkRequest;
use App\Http\Resources\School\HomeworkResource;
use App\Models\Homework;
use App\Services\School\HomeworkService;
use Illuminate\Http\Request;

class HomeworkController extends Controller
{
    public function __construct(protected HomeworkService $homeworkService) {}

    public function index(Request $request)
    {
        $homeworks = Homework::query()
            ->with(['schoolClass', 'stream', 'subject', 'teacher'])
            ->withCount('submissions')
            ->when($request->input('school_class_id'), fn ($q, $id) => $q->where('school_class_id', $id))
            ->when($request->input('subject_id'), fn ($q, $id) => $q->where('subject_id', $id))
            ->when($request->input('teacher_id'), fn ($q, $id) => $q->where('teacher_id', $id))
            ->orderByDesc('due_date')
            ->get();

        return HomeworkResource::collection($homeworks);
    }

    public function store(HomeworkRequest $request)
    {
        $homework = $this->homeworkService->create($request->validated());

        return new HomeworkResource($homework->load(['schoolClass', 'stream', 'subject', 'teacher'])->loadCount('submissions'));
    }

    public function show(Homework $homework)
    {
        return new HomeworkResource(
            $homework->load(['schoolClass', 'stream', 'subject', 'teacher', 'submissions.student'])
        );
    }

    public function update(HomeworkRequest $request, Homework $homework)
    {
        $homework->update($request->validated());

        return new HomeworkResource($homework->load(['schoolClass', 'stream', 'subject', 'teacher'])->loadCount('submissions'));
    }

    public function destroy(Request $request, Homework $homework)
    {
        abort_unless($request->user()->can('homework.manage'), 403);

        $homework->delete();

        return response()->noContent();
    }
}
