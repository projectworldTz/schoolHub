<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks everything except logout/me/change-password for a user who's still
 * on the temporary password an admin generated for them (see
 * SchoolService::create() and AuthController::changePassword()) — a
 * frontend redirect alone isn't enough since it wouldn't stop a direct API
 * call, so this is the actual enforcement point.
 */
class EnsurePasswordHasBeenChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password) {
            abort(423, 'You must change your temporary password before continuing.');
        }

        return $next($request);
    }
}
