<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppNotificationResource;
use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = AppNotification::query()->where('user_id', $request->user()->id);
        $unreadCount = (clone $query)->whereNull('read_at')->count();
        $notifications = $query
            ->latest()
            ->limit(50)
            ->get();

        return AppNotificationResource::collection($notifications)
            ->additional(['meta' => ['unread_count' => $unreadCount]]);
    }

    public function read(Request $request, AppNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 404);

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return new AppNotificationResource($notification);
    }

    public function readAll(Request $request)
    {
        AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->noContent();
    }
}
