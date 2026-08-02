<?php

namespace App\Services\AI;

use App\Models\AiAuditLog;
use App\Models\School;
use App\Models\User;

/**
 * One row per chat turn, success or failure — an append-only ledger (see
 * AiAuditLog::UPDATED_AT), never used to gate anything itself in this
 * phase, just a record of who asked the AI what and what it was allowed to
 * do about it.
 */
class AiAuditService
{
    /** @param  array<string, mixed>|null  $parameters */
    public function record(
        User $user,
        School $school,
        string $status,
        ?string $intent = null,
        ?string $toolName = null,
        ?array $parameters = null,
        ?string $errorMessage = null,
        int $inputTokens = 0,
        int $outputTokens = 0,
    ): AiAuditLog {
        return AiAuditLog::create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'intent' => $intent,
            'tool_name' => $toolName,
            'parameters' => $parameters,
            'status' => $status,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'error_message' => $errorMessage,
        ]);
    }
}
