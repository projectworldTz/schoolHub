<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        // Looking a user up by email is inherently cross-tenant: we don't
        // know which school they belong to until we've found them.
        $attempted = Tenant::runAsPlatform(
            fn () => Auth::attempt($credentials, remember: true)
        );

        if (! $attempted) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        // The tenant context set by ResolveTenantFromUser at the start of
        // this request predates knowing who just logged in — refresh it so
        // any tenant-scoped queries later in this request see the right school.
        Tenant::set($user->school_id);

        if (! $user->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'This account has been deactivated.',
            ]);
        }

        $request->session()->regenerate();

        return new UserResource($user);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }
}
