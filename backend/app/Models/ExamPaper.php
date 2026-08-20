<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamPaper extends Model
{
    use BelongsToSchool, HasFactory, HasUuids;

    protected $attributes = [
        'status' => 'draft',
    ];

    protected $fillable = [
        'school_id',
        'school_class_id',
        'subject_id',
        'created_by',
        'title',
        'exam_date',
        'duration_minutes',
        'instructions',
        'sections',
        'total_marks',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'sections' => 'array',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Sums every question's marks across every section, regardless of
     * format — the one place that understands each section type's shape,
     * so callers never need to branch on 'type' themselves.
     */
    public static function computeTotalMarks(array $sections): int
    {
        $total = 0;

        foreach ($sections as $section) {
            if (($section['type'] ?? null) === 'matching') {
                $total += count($section['correct_matches'] ?? []) * (int) ($section['marks_per_pair'] ?? 0);

                continue;
            }

            foreach ($section['questions'] ?? [] as $question) {
                $total += (int) ($question['marks'] ?? 0);
            }
        }

        return $total;
    }
}
