<?php

namespace App\Services\Notifications;

use App\Models\AppNotification;
use App\Models\User;

class InAppNotificationService
{
    public function send(User $user, string $type, string $title, string $message, ?string $actionUrl = null, array $data = [], ?string $deduplicationKey = null): AppNotification
    {
        $attributes = [
            'school_id' => $user->school_id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data,
        ];

        if ($deduplicationKey) {
            return AppNotification::firstOrCreate([
                'user_id' => $user->id,
                'deduplication_key' => $deduplicationKey,
            ], $attributes);
        }

        return AppNotification::create([
            ...$attributes,
            'user_id' => $user->id,
        ]);
    }
}
