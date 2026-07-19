<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \Laravel\Sanctum\PersonalAccessToken
 *
 * Never includes the plaintext token — Sanctum only exposes that once, at
 * creation time, via NewAccessToken::plainTextToken.
 */
class ApiTokenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'scope' => in_array('*', $this->abilities ?? [], true) ? 'full-access' : 'read-only',
            'last_used_at' => $this->last_used_at,
            'created_at' => $this->created_at,
        ];
    }
}
