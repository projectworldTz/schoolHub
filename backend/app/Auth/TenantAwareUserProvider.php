<?php

namespace App\Auth;

use App\Support\Tenancy\Tenant;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Identifying who a session/token/credentials belong to is inherently a
 * cross-tenant lookup: it's how the tenant gets established in the first
 * place (see App\Http\Middleware\ResolveTenantFromUser). But
 * App\Models\User uses the BelongsToSchool global scope, and Laravel's
 * default EloquentUserProvider queries straight through that scope —
 * so by the time our own tenant-resolution middleware runs, the
 * framework's OWN SessionGuard has already tried (and failed) to find the
 * user, because no tenant context exists yet to satisfy the scope.
 *
 * This provider wraps every retrieval method in Tenant::runAsPlatform(),
 * the same escape hatch used elsewhere for this exact class of problem.
 * It does not weaken tenant isolation: these methods only ever return the
 * single user matching a specific ID/token/credential the caller already
 * possesses — never a list, never anything an unauthenticated caller
 * could use to enumerate users cross-tenant.
 */
class TenantAwareUserProvider extends EloquentUserProvider
{
    public function retrieveById($identifier)
    {
        return Tenant::runAsPlatform(fn () => parent::retrieveById($identifier));
    }

    public function retrieveByToken($identifier, $token)
    {
        return Tenant::runAsPlatform(fn () => parent::retrieveByToken($identifier, $token));
    }

    public function retrieveByCredentials(array $credentials)
    {
        return Tenant::runAsPlatform(fn () => parent::retrieveByCredentials($credentials));
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        Tenant::runAsPlatform(fn () => parent::updateRememberToken($user, $token));
    }
}
