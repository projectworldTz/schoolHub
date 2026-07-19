<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\CourseRequest;
use App\Http\Resources\School\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $courses = Course::query()
            ->with(['subject', 'schoolClass', 'teacher'])
            ->withCount('lessons')
            ->when($request->input('subject_id'), fn ($q, $id) => $q->where('subject_id', $id))
            ->when($request->input('teacher_id'), fn ($q, $id) => $q->where('teacher_id', $id))
            ->orderByDesc('created_at')
            ->get();

        return CourseResource::collection($courses);
    }

    public function store(CourseRequest $request)
    {
        $course = Course::create($request->validated());

        return new CourseResource($course->load(['subject', 'schoolClass', 'teacher']));
    }

    public function show(Course $course)
    {
        return new CourseResource(
            $course->load(['subject', 'schoolClass', 'teacher', 'lessons'])
        );
    }

    public function update(CourseRequest $request, Course $course)
    {
        $course->update($request->validated());

        return new CourseResource($course->load(['subject', 'schoolClass', 'teacher']));
    }

    public function destroy(Request $request, Course $course)
    {
        abort_unless($request->user()->can('lms.manage'), 403);

        $course->delete();

        return response()->noContent();
    }
}
