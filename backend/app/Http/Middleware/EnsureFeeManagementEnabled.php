<?php

namespace App\Http\Middleware;

use App\Services\Finance\FeeManagementAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeeManagementEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        FeeManagementAccess::ensureEnabled();

        return $next($request);
    }
}
