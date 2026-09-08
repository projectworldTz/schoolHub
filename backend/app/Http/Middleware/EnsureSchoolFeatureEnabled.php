<?php

namespace App\Http\Middleware;

use App\Services\School\SchoolFeatureAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolFeatureEnabled
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        SchoolFeatureAccess::ensureEnabled($feature);

        return $next($request);
    }
}
