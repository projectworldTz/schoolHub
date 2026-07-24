<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\School;
use App\Support\Tenancy\Tenant;
use Illuminate\Support\Carbon;

/**
 * The Super Admin's landing page: platform-wide totals (schools, users,
 * approvals pending, licenses at risk) plus a merged activity feed across
 * every tenant. Every query here runs inside Tenant::runAsPlatform() —
 * without it, BelongsToSchool's global scope would restrict `users`/
 * `activity_logs` reads to "school_id IS NULL" (i.e. nothing), since a
 * Super Admin has no school_id of their own. See App\Support\Tenancy\Tenant.
 */
class DashboardController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', School::class);

        return Tenant::runAsPlatform(function () {
            $schools = School::query()->withCount('users')->get();

            $now = Carbon::now();
            $licensesExpiringSoon = $schools->filter(
                fn (School $school) => $school->license_expires_at
                    && $school->license_expires_at->isFuture()
                    && $school->license_expires_at->diffInDays($now) <= 30
            )->count();
            $licensesExpired = $schools->filter(
                fn (School $school) => $school->license_expires_at && $school->license_expires_at->isPast()
            )->count();

            $recentSchools = $schools->sortByDesc('created_at')->take(8)->values()->map(fn (School $school) => [
                'id' => $school->id,
                'name' => $school->name,
                'type' => $school->type,
                'status' => $school->status,
                'users_count' => $school->users_count,
                'created_at' => $school->created_at,
            ]);

            $recentActivity = ActivityLog::query()
                ->with(['user', 'school'])
                ->latest()
                ->limit(25)
                ->get()
                ->map(fn (ActivityLog $log) => [
                    'id' => $log->id,
                    'school_name' => $log->school?->name ?? 'Unknown school',
                    'user_name' => $log->user?->name ?? 'System',
                    'action' => $log->action,
                    'description' => $log->description,
                    'subject_type' => class_basename($log->subject_type),
                    'created_at' => $log->created_at,
                ]);

            return response()->json([
                'data' => [
                    'stats' => [
                        'schools_total' => $schools->count(),
                        'schools_pending' => $schools->where('status', 'pending')->count(),
                        'schools_approved' => $schools->where('status', 'approved')->count(),
                        'schools_suspended' => $schools->where('status', 'suspended')->count(),
                        'users_total' => $schools->sum('users_count'),
                        'licenses_expiring_soon' => $licensesExpiringSoon,
                        'licenses_expired' => $licensesExpired,
                    ],
                    'recent_schools' => $recentSchools,
                    'recent_activity' => $recentActivity,
                ],
            ]);
        });
    }
}
