<?php

namespace App\Http\Middleware;

use App\Models\School;
use App\Services\WebsiteBuilder\WebsitePremiumAccessService;
use App\Support\Tenancy\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Defense-in-depth for every Website Builder CMS route, mirroring how
 * AiAssistantController::accessDenialResponse() gates AI: checked here on
 * the server, not just hidden behind a locked frontend menu item. Two
 * independent axes, both required:
 *   1. website-builder.manage — is this staff member allowed to touch it.
 *   2. School.website_enabled (via WebsitePremiumAccessService) — has the
 *      Platform Administrator actually granted this school the module.
 */
class EnsureWebsiteBuilderAccess
{
    public function __construct(protected WebsitePremiumAccessService $premiumAccess) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->can('website-builder.manage'), 403);

        abort_unless(Tenant::id(), 403, 'This account is not attached to a school.');
        $school = School::findOrFail(Tenant::id());

        $access = $this->premiumAccess->evaluate($school);

        if ($access['code'] !== null) {
            abort(403, $access['message']);
        }

        return $next($request);
    }
}
