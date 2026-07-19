<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\LessonRequest;
use App\Http\Resources\School\LessonResource;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function store(LessonRequest $request, Course $course)
    {
        $lesson = $course->lessons()->create($request->validated());

        return new LessonResource($lesson);
    }

    public function update(LessonRequest $request, Lesson $lesson)
    {
        $lesson->update($request->validated());

        return new LessonResource($lesson);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        abort_unless($request->user()->can('lms.manage'), 403);

        $lesson->delete();

        return response()->noContent();
    }
}
