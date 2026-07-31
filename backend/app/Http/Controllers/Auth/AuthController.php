<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ActivateAccountRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetMail;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
        return $this->redeemPasswordResetToken(
            $request,
            invalidTokenMessage: 'This activation link is invalid or has expired.',
        );
    }

    /**
     * Requests a password-reset email for an existing account. Always
     * responds the same way whether or not the email is registered, so this
     * public endpoint can't be used to enumerate accounts.
     */
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $email = $request->validated()['email'];

        // Same cross-tenant reasoning as login()/activate(): which school
        // this email belongs to (if any) isn't known yet.
        Tenant::runAsPlatform(function () use ($email) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                return;
            }

            $token = Password::broker()->createToken($user);

            Mail::to($user)->send(new PasswordResetMail($user, $token));
        });

        return response()->json([
            'message' => 'If an account exists for that email, a password reset link has been sent.',
        ]);
    }

    /**
     * Redeems the link forgotPassword() emailed, sets a new password, and
     * signs the user in — the redemption side is identical to activate(),
     * just for an account that already existed.
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        return $this->redeemPasswordResetToken(
            $request,
            invalidTokenMessage: 'This reset link is invalid or has expired.',
        );
    }

    private function redeemPasswordResetToken(FormRequest $request, string $invalidTokenMessage)
    {
        $credentials = $request->validated();
        $resetUser = null;

        // The user's school_id isn't known until the broker resolves them by
        // email below — same chicken-and-egg reason login() uses
        // runAsPlatform(), since Tenant isn't set yet on this public route.
        $status = Tenant::runAsPlatform(function () use ($credentials, &$resetUser) {
            return Password::broker()->reset(
                [
                    'email' => $credentials['email'],
                    'token' => $credentials['token'],
                    'password' => $credentials['password'],
                ],
                function (User $user, string $password) use (&$resetUser) {
                    $user->forceFill(['password' => Hash::make($password)])->save();
                    $resetUser = $user;
                }
            );
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => match ($status) {
                    Password::INVALID_USER => 'We could not find an account for that email.',
                    Password::RESET_THROTTLED => 'Please wait a moment before trying again.',
                    default => $invalidTokenMessage,
                },
            ]);
        }

        Auth::login($resetUser);
        Tenant::set($resetUser->school_id);

        if (! $resetUser->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $request->session()->regenerate();

        return new UserResource($resetUser);
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

    /**
     * Redeems the temporary password an admin generated (SchoolService::
     * create()) for a real one the user chose themselves. No old-password
     * confirmation is required — they've already proven who they are by
     * signing in with the temporary one to reach this point, and
     * EnsurePasswordHasBeenChanged blocks everything else in the app until
     * this is done.
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        $user->forceFill([
            'password' => Hash::make($request->validated()['password']),
            'must_change_password' => false,
        ])->save();

        return new UserResource($user);
    }
}
