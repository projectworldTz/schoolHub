<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ApiLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Credential-based token issuance for non-browser clients (mobile apps,
 * third-party integrations) that can't do Sanctum's cookie-based SPA auth.
 * Deliberately bypasses the 'web' session guard entirely — Auth::attempt()
 * would work too, but it creates (and this would then have to immediately
 * tear down) a session for a client that was never going to use one.
 */
class AuthController extends Controller
{
    public function login(ApiLoginRequest $request)
    {
        $data = $request->validated();

        // Looking a user up by email is inherently cross-tenant: we don't
        // know which school they belong to until we've found them — same
        // reasoning as the session-based AuthController::login().
        $user = Tenant::runAsPlatform(fn () => User::where('email', $data['email'])->first());

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'This account has been deactivated.',
            ]);
        }

        $abilities = ($data['abilities'] ?? null) === 'read-only' ? ['read-only'] : ['*'];
        $token = $user->createToken($data['device_name'], $abilities);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'user' => new UserResource($user),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }
}
