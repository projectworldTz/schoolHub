<?php

namespace App\Services\WebsiteBuilder;

use App\Models\School;

class WebsitePremiumAccessService
{
    /**
     * @return array{status: string, code: ?string, message: ?string}
     */
    public function evaluate(School $school): array
    {
        $status = $school->websiteAccessStatus();

        return match ($status) {
            'not_granted' => [
                'status' => $status,
                'code' => 'WEBSITE_ACCESS_NOT_GRANTED',
                'message' => 'Website Builder is a premium feature that has not been activated for your school.',
            ],
            'suspended' => [
                'status' => $status,
                'code' => 'WEBSITE_ACCESS_SUSPENDED',
                'message' => 'Website Builder access has been temporarily suspended. Please contact the Platform Administrator.',
            ],
            'expired' => [
                'status' => $status,
                'code' => 'WEBSITE_ACCESS_EXPIRED',
                'message' => "Your school's Website Builder access has expired. Please contact the Platform Administrator for renewal.",
            ],
            default => ['status' => 'active', 'code' => null, 'message' => null],
        };
    }
}
