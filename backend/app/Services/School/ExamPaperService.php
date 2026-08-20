<?php

namespace App\Services\School;

use App\Models\ExamPaper;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;

/**
 * Orchestration/persistence layer on top of AiAssistantService's exam-paper
 * calls — keeps that service focused on "talk to the LLM" while this one
 * owns turning a reply into a saved, teacher-editable ExamPaper row.
 */
class ExamPaperService
{
    public function __construct(
        protected AiAssistantService $assistant,
    ) {}

    /**
     * @param  array{school_class_id: string, subject_id: string, title: string, exam_date: ?string, duration_minutes: int, sections: array<int, array{type: string, count: int, marks_per_question: int}>, notes: ?string}  $data
     */
    public function generate(array $data, School $school, User $user): ExamPaper
    {
        $subject = Subject::findOrFail($data['subject_id']);
        $schoolClass = SchoolClass::findOrFail($data['school_class_id']);

        $generated = $this->assistant->generateExamPaper([
            'subject_name' => $subject->name,
            'class_name' => $schoolClass->name,
            'title' => $data['title'],
            'exam_date' => $data['exam_date'] ?? null,
            'duration_minutes' => $data['duration_minutes'],
            'sections' => $data['sections'],
            'notes' => $data['notes'] ?? null,
        ], $school, $user);

        return ExamPaper::create([
            'school_class_id' => $data['school_class_id'],
            'subject_id' => $data['subject_id'],
            'created_by' => $user->id,
            'title' => $data['title'],
            'exam_date' => $data['exam_date'] ?? null,
            'duration_minutes' => $data['duration_minutes'],
            'instructions' => $generated['instructions'],
            'sections' => $generated['sections'],
            'total_marks' => ExamPaper::computeTotalMarks($generated['sections']),
        ]);
    }

    public function refine(ExamPaper $paper, string $instruction, School $school, User $user): ExamPaper
    {
        $generated = $this->assistant->refineExamPaper(
            $paper->sections,
            $instruction,
            [
                'subject_name' => $paper->subject->name,
                'class_name' => $paper->schoolClass->name,
                'title' => $paper->title,
                'exam_date' => $paper->exam_date?->toDateString(),
                'duration_minutes' => $paper->duration_minutes,
            ],
            $school,
            $user,
        );

        $paper->update([
            'instructions' => $generated['instructions'],
            'sections' => $generated['sections'],
            'total_marks' => ExamPaper::computeTotalMarks($generated['sections']),
        ]);

        return $paper;
    }

    /**
     * @param  array{title?: string, exam_date?: ?string, duration_minutes?: int, instructions?: string, sections?: array<int, array<string, mixed>>}  $data
     */
    public function applyManualEdit(ExamPaper $paper, array $data): ExamPaper
    {
        if (isset($data['sections'])) {
            $data['total_marks'] = ExamPaper::computeTotalMarks($data['sections']);
        }

        $paper->update($data);

        return $paper;
    }

    public function finalize(ExamPaper $paper): ExamPaper
    {
        $paper->update(['status' => 'finalized']);

        return $paper;
    }
}
