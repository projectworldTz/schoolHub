<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the versioned public API (routes/api.php's 'v1' group). The actual
 * user resolution already happened in ResolveTenantFromUser (via the
 * 'sanctum' guard, without touching the default auth guard — see that
 * class for why); this just rejects requests it didn't resolve a user for,
 * and enforces the read-only/full-access split on personal access token
 * abilities Sanctum already tracks per-token.
 */
class EnsureApiTokenAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 401, 'Unauthenticated.');
        abort_unless($user->is_active, 403, 'This account has been deactivated.');

        if (! in_array($request->method(), ['GET', 'HEAD'], true) && ! $user->tokenCan('*')) {
            abort(403, 'This API token is read-only.');
        }

        return $next($request);
    }
}
