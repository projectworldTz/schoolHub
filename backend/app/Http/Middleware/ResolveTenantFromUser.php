<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs on every API request, before route middleware. Resolves the tenant
 * from the authenticated user (if any) and propagates it to the Eloquent
 * global scope and Spatie's team id — see App\Support\Tenancy\Tenant::set().
 *
 * Unauthenticated requests (login, registration, school sign-up) simply
 * run with no tenant set, which BelongsToSchool treats as "only
 * platform-level rows visible" for tenant-scoped tables — the correct
 * default for a request that hasn't proven who it is.
 *
 * Resolving $request->user() is itself a chicken-and-egg problem: it reads
 * the users table before we know which tenant to scope that read to. That
 * one lookup runs in platform mode (it only returns the single row the
 * active session/token already points at — nothing is disclosed that
 * authentication didn't already grant); everything after this middleware
 * runs correctly scoped to whatever tenant that row belongs to.
 *
 * $request->user() alone only resolves the default ('web', session) guard.
 * Personal-access-token clients (the public API) authenticate via the
 * 'sanctum' guard instead — deliberately checked here with
 * Auth::guard('sanctum'), NOT via 'auth:sanctum' route middleware, because
 * that middleware calls Auth::shouldUse('sanctum'), which flips
 * auth.defaults.guard for the rest of the request. Spatie's permission
 * checks resolve their guard from Auth::getDefaultDriver(), and every
 * permission is seeded under guard_name 'web' — so that switch would make
 * every permission check fail for token clients. Falling back to the
 * sanctum guard here, and re-pointing the request's user resolver at
 * whatever it finds, gives token clients a correctly-resolved
 * $request->user() everywhere downstream without ever touching the
 * default guard.
 *
 * $request->setUserResolver() alone isn't enough, though: Spatie's
 * RoleMiddleware (role:X routes) doesn't call $request->user() at all —
 * it calls Auth::guard($guard)->user(), i.e. the 'web' SessionGuard
 * directly, which has no idea a resolver was set on the request. Injecting
 * the user into that guard instance with ->setUser() fixes that too — it
 * only sets the guard's in-memory $user property for this request, not the
 * session, so it doesn't create a login and doesn't touch the default
 * guard/config the way shouldUse() would.
 */
class ResolveTenantFromUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Tenant::runAsPlatform(function () use ($request) {
            if ($sessionUser = $request->user()) {
                return $sessionUser;
            }

            return Auth::guard('sanctum')->user();
        });

        if ($user && ! $request->user()) {
            $request->setUserResolver(fn () => $user);
            Auth::guard('web')->setUser($user);
        }

        Tenant::set($user?->school_id);

        return $next($request);
    }
}
