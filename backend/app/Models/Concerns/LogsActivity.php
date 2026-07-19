<?php

namespace App\Models\Concerns;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * @mixin Model
 *
 * Opt-in audit trail for a model's create/update/delete — applied only to
 * the models where "who changed this and when" actually matters for
 * disputes (money and grades): Invoice, Payment, Expense, Payslip,
 * ExamResult, Budget. Not applied everywhere, since logging every CRUD
 * action across all 40+ models would bury the genuinely sensitive changes
 * in noise from things like re-ordering a cafeteria menu.
 *
 * Auth::id() (not $request->user()->id — a model event has no $request)
 * resolves correctly for both session and token clients because
 * ResolveTenantFromUser deliberately never calls Auth::shouldUse(), so the
 * default guard stays 'web' either way — see that middleware's docblock.
 * Runs safely with no authenticated user too (seeders, console commands):
 * Auth::id() is just null, and user_id is nullable.
 *
 * Deliberately reads only scalar attributes already on the model in every
 * activityDescription() override, never a relation — several of these
 * models (ExamResult via the bulk gradebook save, Payslip via payroll
 * processing) are written many-at-once in a loop, and touching a relation
 * in the description would turn one N-row save into an N+1 query storm.
 */
trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        $logged = (new static())->logsActivityOn();

        if (in_array('created', $logged, true)) {
            static::created(function ($model) {
                $model->recordActivity('created');
            });
        }

        if (in_array('updated', $logged, true)) {
            static::updated(function ($model) {
                $changes = collect($model->getChanges())
                    ->except(['updated_at'])
                    ->mapWithKeys(fn ($new, $key) => [$key => ['old' => $model->getOriginal($key), 'new' => $new]])
                    ->all();

                if (empty($changes)) {
                    return;
                }

                $model->recordActivity('updated', $changes);
            });
        }

        if (in_array('deleted', $logged, true)) {
            static::deleted(function ($model) {
                $model->recordActivity('deleted');
            });
        }
    }

    /**
     * Which lifecycle events actually get logged — override to narrow this
     * down when "created" (or another event) fires as an uninteresting
     * side effect rather than a real audit-worthy action. ExamResult is
     * the case that matters: a stub row is created for every student the
     * moment a subject is added to an exam, before anyone has graded
     * anything — only the later 'updated' (marks actually entered) is
     * worth logging.
     */
    protected function logsActivityOn(): array
    {
        return ['created', 'updated', 'deleted'];
    }

    protected function recordActivity(string $action, ?array $changes = null): void
    {
        ActivityLog::create([
            'school_id' => $this->school_id,
            'user_id' => Auth::id(),
            'subject_type' => static::class,
            'subject_id' => $this->getKey(),
            'action' => $action,
            'description' => $this->activityDescription($action),
            'changes' => $changes,
        ]);
    }

    protected function activityDescription(string $action): string
    {
        return class_basename($this).' '.$action;
    }
}
