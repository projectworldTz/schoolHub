<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ActivateAccountRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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

    /**
     * Completes the School Owner activation flow (see
     * App\Services\Platform\SchoolService::create()): the owner is created
     * with a random, never-shared password and a Laravel password-reset
     * token is emailed instead — this is where that token gets redeemed for
     * a real, owner-chosen password, and the owner is signed straight in.
     */
    public function activate(ActivateAccountRequest $request)
    {
        $credentials = $request->validated();
        $activatedUser = null;

        // The owner's school_id isn't known until the broker resolves them
        // by email below — same chicken-and-egg reason login() uses
        // runAsPlatform(), since Tenant isn't set yet on this public route.
        $status = Tenant::runAsPlatform(function () use ($credentials, &$activatedUser) {
            return Password::broker()->reset(
                [
                    'email' => $credentials['email'],
                    'token' => $credentials['token'],
                    'password' => $credentials['password'],
                ],
                function (User $user, string $password) use (&$activatedUser) {
                    $user->forceFill(['password' => Hash::make($password)])->save();
                    $activatedUser = $user;
                }
            );
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => match ($status) {
                    Password::INVALID_USER => 'We could not find an account for that email.',
                    Password::RESET_THROTTLED => 'Please wait a moment before trying again.',
                    default => 'This activation link is invalid or has expired.',
                },
            ]);
        }

        Auth::login($activatedUser);
        Tenant::set($activatedUser->school_id);

        if (! $activatedUser->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $request->session()->regenerate();

        return new UserResource($activatedUser);
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
