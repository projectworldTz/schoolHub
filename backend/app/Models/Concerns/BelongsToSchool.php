<?php

namespace App\Models\Concerns;

use App\Models\School;
use App\Support\Tenancy\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The ONLY tenant-isolation mechanism for this model (MySQL has no Postgres
 * RLS equivalent, so there is no database-level backstop — see
 * App\Support\Tenancy\Tenant). Three states:
 *
 *   1. Tenant::isPlatformMode() — scope is suspended, every school's rows
 *      visible. Only reachable via Tenant::runAsPlatform().
 *   2. Tenant::check() — a tenant is set, only that school's rows visible.
 *   3. Neither — deny by default: only platform-level rows (school_id IS
 *      NULL) are visible, e.g. a Super Admin's own account.
 *
 * @mixin Model
 * @property string|null $school_id
 */
trait BelongsToSchool
{
    public static function bootBelongsToSchool(): void
    {
        static::addGlobalScope('school', function (Builder $builder) {
            if (Tenant::isPlatformMode()) {
                return;
            }

            $column = $builder->getModel()->getTable().'.school_id';

            if (Tenant::check()) {
                $builder->where($column, Tenant::id());
            } else {
                $builder->whereNull($column);
            }
        });

        static::creating(function (Model $model) {
            if (! $model->school_id && Tenant::check()) {
                $model->school_id = Tenant::id();
            }
        });
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
