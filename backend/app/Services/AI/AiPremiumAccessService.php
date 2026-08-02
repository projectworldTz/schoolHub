<?php

namespace App\Services\AI;

use App\Models\School;

class AiPremiumAccessService
{
    /**
     * @return array{status: string, code: ?string, message: ?string}
     */
    public function evaluate(School $school): array
    {
        $status = $school->aiAccessStatus();

        return match ($status) {
            'not_granted' => [
                'status' => $status,
                'code' => 'AI_ACCESS_NOT_GRANTED',
                'message' => 'AI Assistant is a premium feature that has not been activated for your school.',
            ],
            'suspended' => [
                'status' => $status,
                'code' => 'AI_ACCESS_SUSPENDED',
                'message' => 'AI Assistant access has been temporarily suspended. Please contact the Platform Administrator.',
            ],
            'expired' => [
                'status' => $status,
                'code' => 'AI_ACCESS_EXPIRED',
                'message' => "Your school's AI Assistant access has expired. Please contact the Platform Administrator for renewal.",
            ],
            default => $this->checkUsageLimit($school),
        };
    }

    /**
     * @return array{status: string, code: ?string, message: ?string}
     */
    protected function checkUsageLimit(School $school): array
    {
        if ($school->ai_monthly_request_limit !== null && $school->aiRequestsThisMonth() >= $school->ai_monthly_request_limit) {
            return [
                'status' => 'active',
                'code' => 'AI_USAGE_LIMIT_REACHED',
                'message' => "Your school has reached its monthly AI Assistant usage limit. It resets at the start of next month, or ask the Platform Administrator to increase it.",
            ];
        }

        return ['status' => 'active', 'code' => null, 'message' => null];
    }
}
