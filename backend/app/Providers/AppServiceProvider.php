<?php

namespace App\Providers;

use App\Auth\TenantAwareUserProvider;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // See App\Auth\TenantAwareUserProvider for why this exists: the
        // default Eloquent provider queries straight through User's
        // BelongsToSchool scope, which breaks framework-internal auth
        // lookups (they run before any tenant context is established).
        Auth::provider('tenant-aware-eloquent', fn ($app, array $config) => new TenantAwareUserProvider(
            $app['hash'],
            $config['model']
        ));

        // Super Admin (Platform) bypasses every policy/permission check.
        // Returning null (not false) for non-Super-Admins lets normal
        // policy/permission resolution continue as usual.
        Gate::before(fn (User $user) => $user->hasRole('Super Admin') ? true : null);

        // Public API (routes/api.php 'v1' group): 120 req/min per
        // authenticated user, falling back to per-IP for the unauthenticated
        // token-login endpoint itself.
        RateLimiter::for('api-token', fn ($request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));

        // Token login is credential-guessing surface — throttle tighter and
        // strictly by IP, since there's no authenticated user yet to key on.
        RateLimiter::for('api-token-login', fn ($request) => Limit::perMinute(10)->by($request->ip()));

        // SPA session login (AuthController::login) — the main
        // password-guessing surface for the whole app. Keyed by
        // email+IP, not IP alone: a school's staff/parents can share one
        // network IP, and IP-only throttling would let one person's failed
        // attempts lock out everyone else trying to sign into their own,
        // different accounts from the same building.
        RateLimiter::for('login', fn ($request) => Limit::perMinute(5)->by(
            Str::lower((string) $request->input('email')).'|'.$request->ip()
        ));

        // Public Notice Board (routes/api.php 'public' group, no auth at
        // all): keyed by IP since there's no user, generous enough for a
        // classroom of students all checking results at once from the
        // same school network.
        RateLimiter::for('notice-board', fn ($request) => Limit::perMinute(60)->by($request->ip()));

        // AI Assistant chat/lesson-plan endpoints hit a paid external API —
        // throttled tighter than general API traffic and keyed per user so
        // one runaway frontend loop can't run up the whole school's bill.
        RateLimiter::for('ai-assistant', fn ($request) => Limit::perMinute(15)->by($request->user()?->id ?: $request->ip()));

        // Public school website (Website Builder module, no auth at all):
        // same reasoning as notice-board — keyed by IP, generous enough for
        // a normal browsing session.
        RateLimiter::for('public-website', fn ($request) => Limit::perMinute(60)->by($request->ip()));

        // The page-view/section-view/download/admission-click beacon fires
        // far more often than a normal page load (once per section scroll-
        // into-view) — looser per-minute cap, still IP-keyed.
        RateLimiter::for('public-website-track', fn ($request) => Limit::perMinute(120)->by($request->ip()));
    }
}
