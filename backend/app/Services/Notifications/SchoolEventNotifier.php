<?php

namespace App\Services\Notifications;

use App\Models\Announcement;
use App\Models\Exam;
use App\Models\Invoice;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;

class SchoolEventNotifier
{
    public function __construct(private InAppNotificationService $notifications) {}

    public function attendance(Student $student, string $status, string $date): void
    {
        if (! in_array($status, ['absent', 'late'], true)) {
            return;
        }

        $label = ucfirst($status);
        $this->sendToGuardians(
            $student,
            'attendance_concern',
            "Attendance: {$student->full_name}",
            "{$student->full_name} was marked {$label} on {$date}.",
            '/parent/dashboard',
            ['student_id' => $student->id, 'status' => $status, 'date' => $date],
            "attendance:{$student->id}:{$date}:{$status}",
        );
    }

    public function payment(Invoice $invoice, string $paymentId, string $amount): void
    {
        $invoice->loadMissing('student.guardians.user');
        $student = $invoice->student;

        $this->sendToGuardians(
            $student,
            'payment_confirmation',
            'Payment received',
            "Payment of TZS {$amount} was recorded for {$student->full_name} ({$invoice->invoice_number}).",
            "/parent/students/{$student->id}/invoices/{$invoice->id}",
            ['student_id' => $student->id, 'invoice_id' => $invoice->id, 'payment_id' => $paymentId],
            "payment:{$paymentId}",
        );
    }

    public function announcement(Announcement $announcement): void
    {
        $users = match ($announcement->audience) {
            'role' => User::query()->where('is_active', true)->role($announcement->role)->get(),
            'class' => $this->classAudience($announcement->school_class_id),
            default => User::query()->where('is_active', true)->get(),
        };

        foreach ($users->unique('id') as $user) {
            $this->notifications->send(
                $user,
                'announcement',
                $announcement->title,
                $announcement->body,
                $user->hasRole('Parent') ? '/parent/dashboard' : '/app/communication',
                ['announcement_id' => $announcement->id],
                "announcement:{$announcement->id}",
            );
        }
    }

    public function examPublished(Exam $exam): void
    {
        $studentIds = Student::query()
            ->whereHas('examResults.examSubject', fn ($query) => $query->where('exam_id', $exam->id))
            ->pluck('id');

        Student::query()->whereIn('id', $studentIds)->with('guardians.user')->each(function (Student $student) use ($exam) {
            $this->sendToGuardians(
                $student,
                'exam_results',
                'Exam results published',
                "{$exam->name} results are now available for {$student->full_name}.",
                '/parent/dashboard',
                ['exam_id' => $exam->id, 'student_id' => $student->id],
                "exam-published:{$exam->id}:{$student->id}",
            );
        });
    }

    private function sendToGuardians(
        Student $student,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl,
        array $data,
        string $deduplicationKey,
    ): void {
        $student->loadMissing('guardians.user');

        foreach ($student->guardians->pluck('user')->filter()->unique('id') as $user) {
            $this->notifications->send($user, $type, $title, $message, $actionUrl, $data, $deduplicationKey);
        }
    }

    private function classAudience(?string $schoolClassId): Collection
    {
        if (! $schoolClassId) {
            return collect();
        }

        $students = Student::query()
            ->whereHas('enrollments', fn ($query) => $query->where('school_class_id', $schoolClassId)->where('status', 'active'))
            ->with(['user', 'guardians.user'])
            ->get();

        return $students->flatMap(fn (Student $student) => collect([$student->user])
            ->merge($student->guardians->pluck('user')))
            ->filter();
    }
}
