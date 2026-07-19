<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ApiTokenRequest;
use App\Http\Resources\ApiTokenResource;
use Illuminate\Http\Request;

/**
 * Self-service API key management for the logged-in SPA user — lets someone
 * mint a personal access token for the public API (routes/api.php 'v1'
 * group) from the dashboard, without a platform admin's involvement. Every
 * action is implicitly scoped to $request->user()->tokens(): there is no
 * "manage anyone's tokens" permission, on purpose — a token is a credential
 * for whoever created it, same trust boundary as a password.
 */
class ApiTokenController extends Controller
{
    public function index(Request $request)
    {
        return ApiTokenResource::collection(
            $request->user()->tokens()->orderByDesc('created_at')->get()
        );
    }

    public function store(ApiTokenRequest $request)
    {
        $data = $request->validated();
        $abilities = ($data['abilities'] ?? null) === 'read-only' ? ['read-only'] : ['*'];

        $token = $request->user()->createToken($data['name'], $abilities);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'id' => $token->accessToken->id,
                'name' => $token->accessToken->name,
                'scope' => $abilities === ['*'] ? 'full-access' : 'read-only',
                'created_at' => $token->accessToken->created_at,
            ],
        ], 201);
    }

    public function destroy(Request $request, string $token)
    {
        $request->user()->tokens()->where('id', $token)->delete();

        return response()->noContent();
    }
}
