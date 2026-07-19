<?php

namespace App\Providers;

use App\Auth\TenantAwareUserProvider;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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

        // Public Notice Board (routes/api.php 'public' group, no auth at
        // all): keyed by IP since there's no user, generous enough for a
        // classroom of students all checking results at once from the
        // same school network.
        RateLimiter::for('notice-board', fn ($request) => Limit::perMinute(60)->by($request->ip()));

        // AI Assistant chat/lesson-plan endpoints hit a paid external API —
        // throttled tighter than general API traffic and keyed per user so
        // one runaway frontend loop can't run up the whole school's bill.
        RateLimiter::for('ai-assistant', fn ($request) => Limit::perMinute(15)->by($request->user()?->id ?: $request->ip()));
    }
}
